import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather';
import {
  ConditionLogic,
  ConditionSourceType,
  ConditionType,
  MetricType,
  ValueSource,
} from './dto';
import { TriggerContextService } from './trigger-context.service';
import { TriggerEvaluatorService } from './trigger-evaluator.service';
import { parseTriggerConditions } from './trigger-condition.utils';
import {
  calculateEmc,
  calculateMedian,
  getMetricUnit,
  getMetricValueFromReading,
} from './trigger-metrics.util';
import type {
  AlertCandidate,
  AlertWriter,
  BallReading,
  EvaluationInputs,
  HistoryCache,
  LocalHistory,
  LookupTableData,
  Reading,
  SourceWindow,
  TriggerCondition,
  TriggerScope,
} from './trigger.type';

@Injectable()
export class TriggerEngineService {
  private readonly logger = new Logger(TriggerEngineService.name);
  private readonly lookupCache = new Map<string, LookupTableData>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly triggerContext: TriggerContextService,
    private readonly evaluator: TriggerEvaluatorService,
    private readonly weatherService: WeatherService,
  ) {}

  /**
   * Evaluate triggers for a gateway payload that may include multiple balls,
   * plus gateway and outside readings. This covers SENSOR/GATEWAY/OUTSIDE sources.
   */
  async evaluateGatewayPayload(
    scope: TriggerScope,
    inputs: EvaluationInputs,
    options?: {
      alertWriter?: AlertWriter;
      skipExistingCheck?: boolean;
      persistAlerts?: boolean;
      localHistory?: LocalHistory;
    },
  ): Promise<void> {
    if (!scope.cellId || !scope.siteId) {
      return;
    }

    this.logger.debug(
      `engine: evaluate gateway payload cell=${scope.cellId} site=${scope.siteId} gateway=${scope.gatewayId ?? 'none'} recordedAt=${inputs.recordedAt.toISOString()}`,
    );

    // Fetch triggers scoped to this org/commodity/site.
    const triggers = await this.triggerContext.findMatchingTriggers(
      {
        organizationId: scope.organizationId,
        commodityTypeId: scope.commodityTypeId,
      },
      { sensorMatch: 'generic' },
    );

    if (triggers.length === 0) {
      this.logger.debug('engine: no triggers found');
      return;
    }

    this.logger.debug(`engine: triggers=${triggers.length}`);

    // Preload lookup table (EMC) and histories for change conditions.
    const lookupTable = scope.commodityTypeId
      ? await this.getLookupTable(scope.commodityTypeId)
      : undefined;
    const maxWindows = this.getMaxWindows(triggers);
    const histories = await this.loadHistories(
      scope,
      inputs,
      maxWindows,
      options?.localHistory,
    );

    const candidates: AlertCandidate[] = [];
    for (const trigger of triggers) {
      const conditions = parseTriggerConditions(trigger.conditions);
      const matchedConditionIds: string[] = [];
      const failedConditionIds: string[] = [];

      for (const condition of conditions) {
        const sources = this.resolveSources(condition);
        let conditionMatched = false;

        // Evaluate the condition against each applicable source.
        for (const source of sources) {
          const match = await this.evaluateConditionForSource({
            condition,
            source,
            lookupTable,
            inputs,
            scope,
            histories,
          });

          if (match) {
            conditionMatched = true;
            break; // valueSources is ANY
          }
        }

        if (conditionMatched) {
          matchedConditionIds.push(condition.id);
        } else {
          failedConditionIds.push(condition.id);
        }
      }

      const logic =
        trigger.conditionLogic === ConditionLogic.OR
          ? ConditionLogic.OR
          : ConditionLogic.AND;
      const matches =
        logic === ConditionLogic.AND
          ? failedConditionIds.length === 0 && matchedConditionIds.length > 0
          : matchedConditionIds.length > 0;

      if (!matches) {
        this.logger.debug(
          `engine: trigger=${trigger.id} no match (matched=${matchedConditionIds.length} failed=${failedConditionIds.length})`,
        );
        continue;
      }

      this.logger.debug(
        `engine: trigger=${trigger.id} matched (conditions=${matchedConditionIds.length})`,
      );

      const candidate = await this.ensureAlertForTrigger(
        {
          trigger,
          siteId: scope.siteId,
          compoundId: scope.compoundId,
          cellId: scope.cellId,
          organizationId: scope.organizationId,
          matchedConditionIds,
        },
        options,
      );
      if (candidate) {
        candidates.push(candidate);
      }
    }

    if (options?.alertWriter) {
      for (const candidate of candidates) {
        await options.alertWriter(candidate);
      }
    }

    const shouldPersist = options?.persistAlerts ?? true;
    if (shouldPersist && candidates.length > 0) {
      await this.prisma.alert.createMany({
        data: candidates.map((candidate) => ({
          triggerId: candidate.triggerId,
          siteId: candidate.siteId,
          compoundId: candidate.compoundId ?? undefined,
          cellId: candidate.cellId ?? undefined,
          sensorId: candidate.sensorId ?? undefined,
          organizationId: candidate.organizationId ?? undefined,
          title: candidate.title,
          description: candidate.description,
          descriptionKey: candidate.descriptionKey,
          descriptionParams: candidate.descriptionParams as any,
          severity: candidate.severity as any,
          thresholdValue: candidate.thresholdValue,
          unit: candidate.unit,
        })),
      });
    }
  }

  /**
   * Expand a condition into the concrete sources it applies to.
   */
  private resolveSources(condition: TriggerCondition): ConditionSourceType[] {
    if (condition.sourceType) {
      return [condition.sourceType];
    }
    if (condition.valueSources && condition.valueSources.length > 0) {
      return condition.valueSources.map((source) => {
        if (source === ValueSource.OUTSIDE) {
          return ConditionSourceType.OUTSIDE;
        }
        return ConditionSourceType.GATEWAY;
      });
    }
    return [ConditionSourceType.SENSOR];
  }

  /**
   * Evaluate a condition against a single source (SENSOR/GATEWAY/OUTSIDE).
   */
  private async evaluateConditionForSource(params: {
    condition: TriggerCondition;
    source: ConditionSourceType;
    lookupTable?: LookupTableData;
    inputs: EvaluationInputs;
    scope: TriggerScope;
    histories: HistoryCache;
  }): Promise<boolean> {
    const { condition, source, lookupTable, inputs, scope, histories } = params;

    if (source === ConditionSourceType.SENSOR) {
      // Sensor source uses ball readings (per-sensor history).
      return this.evaluateSensorCondition(
        condition,
        inputs,
        lookupTable,
        histories.sensorHistoryById,
      );
    }

    if (source === ConditionSourceType.OUTSIDE) {
      // Outside source uses site-level weather observations.
      if (!inputs.outside) {
        return false;
      }
      return this.evaluateScalarCondition(
        condition,
        inputs.outside,
        lookupTable,
        histories.outsideHistory,
        {
          source: 'OUTSIDE',
          sourceId: scope.siteId ?? '',
          recordedAt: inputs.recordedAt,
        },
      );
    }

    if (!inputs.gateway) {
      return false;
    }
    // Gateway source uses the gateway reading stream.
    return this.evaluateScalarCondition(
      condition,
      inputs.gateway,
      lookupTable,
      histories.gatewayHistory,
      {
        source: 'GATEWAY',
        sourceId: scope.gatewayId ?? '',
        recordedAt: inputs.recordedAt,
      },
    );
  }

  /**
   * Evaluate a condition for a single sensor, including change-over-time.
   */
  private async evaluateSensorCondition(
    condition: TriggerCondition,
    inputs: EvaluationInputs,
    lookupTable?: LookupTableData,
    historyBySensorId?: Map<string, Reading[]>,
  ): Promise<boolean> {
    const balls = inputs.balls ?? [];
    if (balls.length === 0) {
      return false;
    }

    if (condition.type === ConditionType.CHANGE) {
      // Change conditions compare to a baseline within a time window.
      return this.evaluateSensorChangeCondition(
        condition,
        inputs,
        lookupTable,
        historyBySensorId,
      );
    }

    // Threshold conditions use the current values.
    const values = this.getBallMetricValues(
      condition.metric,
      balls,
      lookupTable,
    );
    if (values.length === 0) {
      return false;
    }

    if (this.isMedianMetric(condition.metric)) {
      const median = calculateMedian(values);
      if (median === undefined) {
        return false;
      }
      return this.evaluator.evaluateConditionForValue(condition, median);
    }

    return values.some((value) =>
      this.evaluator.evaluateConditionForValue(condition, value),
    );
  }

  /**
   * Evaluate a change condition for a sensor using history + baseline.
   */
  private evaluateSensorChangeCondition(
    condition: TriggerCondition,
    inputs: EvaluationInputs,
    lookupTable?: LookupTableData,
    historyBySensorId?: Map<string, Reading[]>,
  ): boolean {
    const balls = inputs.balls ?? [];
    if (balls.length === 0) {
      return false;
    }

    const windowHours = condition.timeWindowHours ?? 1;
    const windowStart = new Date(
      inputs.recordedAt.getTime() - windowHours * 60 * 60 * 1000,
    );

    if (this.isMedianMetric(condition.metric)) {
      const baselineValues: number[] = [];
      const currentValues = this.getBallMetricValues(
        condition.metric,
        balls,
        lookupTable,
      );

      for (const ball of balls) {
        const sensorId = inputs.sensorIdByExternal?.get(ball.id);
        if (!sensorId) {
          continue;
        }
        const baselineReading = historyBySensorId?.size
          ? this.findBaselineReading(
              historyBySensorId.get(sensorId),
              windowStart,
            )
          : undefined;
        if (!baselineReading) {
          continue;
        }

        const baselineEmc =
          condition.metric === MetricType.EMC &&
          lookupTable &&
          baselineReading.temperature !== undefined &&
          baselineReading.humidity !== undefined
            ? calculateEmc(
                lookupTable,
                baselineReading.temperature,
                baselineReading.humidity,
              )
            : undefined;

        const baselineValue = getMetricValueFromReading(condition.metric, {
          temperature: baselineReading.temperature,
          humidity: baselineReading.humidity,
          emc: baselineEmc,
        });

        if (baselineValue !== undefined) {
          baselineValues.push(baselineValue);
        }
      }

      const baselineMedian = calculateMedian(baselineValues);
      const currentMedian = calculateMedian(currentValues);

      if (baselineMedian === undefined || currentMedian === undefined) {
        return false;
      }

      return this.evaluator.evaluateConditionForValue(
        condition,
        currentMedian,
        { [condition.metric]: baselineMedian },
      );
    }

    for (const ball of balls) {
      const sensorId = inputs.sensorIdByExternal?.get(ball.id);
      if (!sensorId) {
        continue;
      }

      const baselineReading = historyBySensorId?.size
        ? this.findBaselineReading(historyBySensorId.get(sensorId), windowStart)
        : undefined;
      if (!baselineReading) {
        continue;
      }

      const current = getMetricValueFromReading(condition.metric, {
        temperature: ball.temperature,
        humidity: ball.humidity,
        emc: lookupTable
          ? calculateEmc(lookupTable, ball.temperature, ball.humidity)
          : undefined,
      });

      if (current === undefined) {
        continue;
      }

      const baselineEmc =
        condition.metric === MetricType.EMC && lookupTable
          ? calculateEmc(
              lookupTable,
              baselineReading.temperature,
              baselineReading.humidity,
            )
          : undefined;

      const previous = getMetricValueFromReading(condition.metric, {
        temperature: baselineReading.temperature,
        humidity: baselineReading.humidity,
        emc: baselineEmc,
      });

      if (previous === undefined) {
        continue;
      }

      if (
        this.evaluator.evaluateConditionForValue(condition, current, {
          [condition.metric]: previous,
        })
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate a condition against a single scalar value stream.
   */
  private evaluateScalarCondition(
    condition: TriggerCondition,
    reading: Reading,
    lookupTable: LookupTableData | undefined,
    history: Reading[],
    baselineRequest: {
      source: 'GATEWAY' | 'OUTSIDE';
      sourceId: string;
      recordedAt: Date;
    },
  ): boolean {
    if (condition.type === ConditionType.THRESHOLD) {
      // Compare the current scalar value to the threshold.
      const current = this.getScalarMetricValue(
        condition.metric,
        reading,
        lookupTable,
      );
      if (current === undefined) {
        return false;
      }
      return this.evaluator.evaluateConditionForValue(condition, current);
    }

    // For change conditions, compute a baseline within the window.
    const windowHours = condition.timeWindowHours ?? 1;
    if (!baselineRequest.sourceId) {
      return false;
    }
    const windowStart = new Date(
      baselineRequest.recordedAt.getTime() - windowHours * 60 * 60 * 1000,
    );
    const baselineReading = this.findBaselineReading(history, windowStart);
    if (!baselineReading) {
      return false;
    }

    const current = this.getScalarMetricValue(
      condition.metric,
      reading,
      lookupTable,
    );
    const baselineEmc =
      condition.metric === MetricType.EMC &&
      lookupTable &&
      baselineReading.temperature !== undefined &&
      baselineReading.humidity !== undefined
        ? calculateEmc(
            lookupTable,
            baselineReading.temperature,
            baselineReading.humidity,
          )
        : undefined;
    const previous = getMetricValueFromReading(condition.metric, {
      temperature: baselineReading.temperature,
      humidity: baselineReading.humidity,
      emc: baselineEmc,
    });

    if (current === undefined || previous === undefined) {
      return false;
    }

    return this.evaluator.evaluateConditionForValue(condition, current, {
      [condition.metric]: previous,
    });
  }

  /**
   * Resolve the numeric value for a metric from a single reading.
   */
  private getScalarMetricValue(
    metric: MetricType,
    reading: Reading,
    lookupTable?: LookupTableData,
  ): number | undefined {
    if (metric === MetricType.EMC) {
      if (!lookupTable) {
        return undefined;
      }
      return calculateEmc(lookupTable, reading.temperature, reading.humidity);
    }

    return getMetricValueFromReading(metric, {
      temperature: reading.temperature,
      humidity: reading.humidity,
    });
  }

  /**
   * Resolve metric values for all balls (used for median/aggregate).
   */
  private getBallMetricValues(
    metric: MetricType,
    balls: BallReading[],
    lookupTable?: LookupTableData,
  ): number[] {
    return balls
      .map((ball) => {
        const emc = lookupTable
          ? calculateEmc(lookupTable, ball.temperature, ball.humidity)
          : undefined;
        return getMetricValueFromReading(metric, {
          temperature: ball.temperature,
          humidity: ball.humidity,
          emc,
        });
      })
      .filter((value): value is number => value !== undefined);
  }

  /**
   * Identify metrics that should use median aggregation.
   */
  private isMedianMetric(metric: MetricType): boolean {
    return (
      metric === MetricType.MEDIAN_TEMPERATURE ||
      metric === MetricType.MEDIAN_HUMIDITY
    );
  }

  /**
   * Load the lookup table (EMC) with simple in-memory caching.
   */
  private async getLookupTable(
    commodityTypeId: string,
  ): Promise<LookupTableData | undefined> {
    if (this.lookupCache.has(commodityTypeId)) {
      return this.lookupCache.get(commodityTypeId);
    }

    const lookup = await this.prisma.lookupTable.findUnique({
      where: { commodityTypeId },
      select: { data: true },
    });

    if (!lookup) {
      return undefined;
    }

    const data = lookup.data as LookupTableData;
    if (!data?.tempRanges || !data?.humidityRanges || !data?.values) {
      this.logger.warn(
        `Lookup table for commodityTypeId=${commodityTypeId} is missing ranges`,
      );
      return undefined;
    }

    this.lookupCache.set(commodityTypeId, data);
    return data;
  }

  /**
   * Compute the max history window needed per source.
   */
  private getMaxWindows(triggers: Array<{ conditions: any }>): SourceWindow {
    const max: SourceWindow = {
      sensorHours: 0,
      gatewayHours: 0,
      outsideHours: 0,
    };

    triggers.forEach((trigger) => {
      const conditions = parseTriggerConditions(trigger.conditions);
      conditions.forEach((condition) => {
        if (condition.type !== ConditionType.CHANGE) {
          return;
        }
        const windowHours = condition.timeWindowHours ?? 1;
        const sources = this.resolveSources(condition);
        sources.forEach((source) => {
          if (source === ConditionSourceType.SENSOR) {
            max.sensorHours = Math.max(max.sensorHours, windowHours);
          } else if (source === ConditionSourceType.OUTSIDE) {
            max.outsideHours = Math.max(max.outsideHours, windowHours);
          } else {
            max.gatewayHours = Math.max(max.gatewayHours, windowHours);
          }
        });
      });
    });

    return max;
  }

  /**
   * Load the historical readings required for change conditions.
   * Local history is merged in for in-batch evaluation when provided.
   */
  private async loadHistories(
    scope: TriggerScope,
    inputs: EvaluationInputs,
    windows: SourceWindow,
    localHistory?: LocalHistory,
  ): Promise<HistoryCache> {
    const sensorHistoryById = new Map<string, Reading[]>();
    const gatewayHistory: Reading[] = [];
    let outsideHistory: Reading[] = [];

    const end = inputs.recordedAt;

    // Load sensor history for change conditions.
    if (windows.sensorHours > 0 && inputs.sensorIdByExternal) {
      const sensorIds = Array.from(inputs.sensorIdByExternal.values());
      if (sensorIds.length > 0) {
        const start = new Date(
          end.getTime() - windows.sensorHours * 60 * 60 * 1000,
        );
        const sensorReadings = await this.prisma.sensorReading.findMany({
          where: {
            sensorId: { in: sensorIds },
            recordedAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { recordedAt: 'asc' },
          select: {
            sensorId: true,
            temperature: true,
            humidity: true,
            recordedAt: true,
          },
        });

        sensorReadings.forEach((reading) => {
          const list = sensorHistoryById.get(reading.sensorId) ?? [];
          list.push({
            temperature: reading.temperature,
            humidity: reading.humidity,
            recordedAt: reading.recordedAt,
          });
          sensorHistoryById.set(reading.sensorId, list);
        });
      }
    }

    // Load gateway history for change conditions.
    if (windows.gatewayHours > 0 && scope.gatewayId) {
      const start = new Date(
        end.getTime() - windows.gatewayHours * 60 * 60 * 1000,
      );
      const readings = await this.prisma.gatewayReading.findMany({
        where: {
          gatewayId: scope.gatewayId,
          recordedAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { recordedAt: 'asc' },
        select: {
          temperature: true,
          humidity: true,
          recordedAt: true,
        },
      });
      readings.forEach((reading) => {
        gatewayHistory.push({
          temperature: reading.temperature,
          humidity: reading.humidity,
          recordedAt: reading.recordedAt,
        });
      });
    }

    // Load outside history for change conditions (with fallback).
    if (windows.outsideHours > 0 && scope.siteId) {
      const start = new Date(
        end.getTime() - windows.outsideHours * 60 * 60 * 1000,
      );
      outsideHistory = await this.loadOutsideHistoryWithFallback(
        scope.siteId,
        start,
        end,
      );
    }

    const mergedSensorHistory = this.mergeSensorHistory(
      sensorHistoryById,
      localHistory?.sensorHistoryById,
      end,
      windows.sensorHours,
    );
    const mergedGatewayHistory = this.mergeHistory(
      gatewayHistory,
      localHistory?.gatewayHistory,
      end,
      windows.gatewayHours,
    );
    const mergedOutsideHistory = this.mergeHistory(
      outsideHistory,
      localHistory?.outsideHistory,
      end,
      windows.outsideHours,
    );

    return {
      sensorHistoryById: mergedSensorHistory,
      gatewayHistory: mergedGatewayHistory,
      outsideHistory: mergedOutsideHistory,
    };
  }

  /**
   * Merge DB history with local in-batch history for a single source.
   */
  private mergeHistory(
    base: Reading[],
    local: Reading[] | undefined,
    end: Date,
    windowHours: number,
  ): Reading[] {
    if (!local || local.length === 0) {
      return base;
    }

    const start = new Date(end.getTime() - windowHours * 60 * 60 * 1000);
    const filteredLocal = local.filter(
      (reading) => reading.recordedAt >= start && reading.recordedAt <= end,
    );

    const merged = [...base, ...filteredLocal];
    merged.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    return merged;
  }

  /**
   * Merge DB sensor history with local in-batch history per sensor ID.
   */
  private mergeSensorHistory(
    base: Map<string, Reading[]>,
    local: Map<string, Reading[]> | undefined,
    end: Date,
    windowHours: number,
  ): Map<string, Reading[]> {
    if (!local || local.size === 0) {
      return base;
    }

    const start = new Date(end.getTime() - windowHours * 60 * 60 * 1000);
    const merged = new Map(base);

    for (const [sensorId, readings] of local.entries()) {
      const filtered = readings.filter(
        (reading) => reading.recordedAt >= start && reading.recordedAt <= end,
      );
      if (filtered.length === 0) {
        continue;
      }
      const existing = merged.get(sensorId) ?? [];
      const combined = [...existing, ...filtered];
      combined.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
      merged.set(sensorId, combined);
    }

    return merged;
  }

  /**
   * Find the earliest reading at/after a time cutoff.
   */
  private findBaselineReading(
    readings: Reading[] | undefined,
    windowStart: Date,
  ): Reading | undefined {
    if (!readings || readings.length === 0) {
      return undefined;
    }
    return readings.find((reading) => reading.recordedAt >= windowStart);
  }

  /**
   * Load outside history or fall back to the latest available.
   */
  private async loadOutsideHistoryWithFallback(
    siteId: string,
    start: Date,
    end: Date,
  ): Promise<Reading[]> {
    const existing = await this.prisma.weatherObservation.findMany({
      where: {
        siteId,
        recordedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        temperature: true,
        humidity: true,
        recordedAt: true,
      },
    });

    if (existing.length > 0) {
      return existing.map((item) => ({
        temperature: item.temperature,
        humidity: item.humidity,
        recordedAt: item.recordedAt,
      }));
    }

    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { latitude: true, longitude: true },
    });

    if (site?.latitude && site?.longitude) {
      await this.weatherService.ensureWeatherObservationsForRange(
        siteId,
        site.latitude,
        site.longitude,
        start,
        end,
      );
    }

    const refreshed = await this.prisma.weatherObservation.findMany({
      where: {
        siteId,
        recordedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        temperature: true,
        humidity: true,
        recordedAt: true,
      },
    });

    return refreshed.map((item) => ({
      temperature: item.temperature,
      humidity: item.humidity,
      recordedAt: item.recordedAt,
    }));
  }

  /**
   * Build description payload for alert localization.
   */
  private buildAlertDescriptionPayload(
    triggerName: string,
    matchedConditions: TriggerCondition[],
  ) {
    const conditionParams = matchedConditions.map((condition) => {
      const raw = condition as any;
      return {
        type: condition.type ?? raw.type,
        metric: condition.metric ?? raw.metric,
        operator: condition.operator ?? raw.operator,
        value: condition.value ?? raw.value,
        secondaryValue:
          condition.secondaryValue ?? raw.secondaryValue ?? raw.secondary_value,
        changeDirection:
          condition.changeDirection ??
          raw.changeDirection ??
          raw.change_direction,
        changeAmount:
          condition.changeAmount ?? raw.changeAmount ?? raw.change_amount,
        timeWindowHours:
          condition.timeWindowHours ??
          raw.timeWindowHours ??
          raw.time_window_hours,
        timeWindowDays: raw.time_window_days,
        unit: getMetricUnit((condition.metric ?? raw.metric) as any),
        valueSources:
          condition.valueSources ?? raw.valueSources ?? raw.value_sources,
        sourceType: condition.sourceType ?? raw.sourceType ?? raw.source_type,
      };
    });

    if (matchedConditions.length === 0) {
      return {
        description: `Trigger "${triggerName}" matched.`,
        descriptionKey: 'alert.description.triggerMatched',
        descriptionParams: {
          triggerName,
          conditions: [],
        },
      };
    }

    return {
      description: `Trigger "${triggerName}" matched.`,
      descriptionKey: 'alert.description.triggerMatched',
      descriptionParams: {
        triggerName,
        conditions: conditionParams,
      },
    };
  }

  /**
   * Extract a representative threshold for alert display.
   */
  private getAlertThreshold(matchedConditions: TriggerCondition[]): {
    value?: number;
    unit?: string;
  } {
    const threshold = matchedConditions.find(
      (condition) =>
        condition.type === 'THRESHOLD' && condition.value !== undefined,
    );

    if (!threshold) {
      return {};
    }

    return {
      value: threshold.value,
      unit: getMetricUnit(threshold.metric),
    };
  }

  /**
   * Create an alert for a trigger if not already present.
   */
  private async ensureAlertForTrigger(
    params: {
      trigger: { id: string; name: string; severity: string; conditions: any };
      siteId: string;
      compoundId?: string | null;
      cellId?: string | null;
      sensorId?: string | null;
      organizationId?: string | null;
      matchedConditionIds: string[];
    },
    options?: {
      alertWriter?: AlertWriter;
      skipExistingCheck?: boolean;
      persistAlerts?: boolean;
    },
  ): Promise<AlertCandidate | null> {
    // Avoid duplicate open alerts unless explicitly skipped.
    if (!options?.skipExistingCheck) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          triggerId: params.trigger.id,
          cellId: params.cellId ?? null,
          sensorId: params.sensorId ?? null,
          status: {
            in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
          },
        },
        select: { id: true },
      });

      if (existing) {
        return null;
      }
    }

    // Build description + threshold for alert payload.
    const conditions = parseTriggerConditions(params.trigger.conditions);
    const matchedConditions = conditions.filter((condition) =>
      params.matchedConditionIds.includes(condition.id),
    );

    const { description, descriptionKey, descriptionParams } =
      this.buildAlertDescriptionPayload(params.trigger.name, matchedConditions);
    const threshold = this.getAlertThreshold(matchedConditions);

    const candidate: AlertCandidate = {
      triggerId: params.trigger.id,
      siteId: params.siteId,
      compoundId: params.compoundId ?? null,
      cellId: params.cellId ?? null,
      sensorId: params.sensorId ?? null,
      organizationId: params.organizationId ?? null,
      title: params.trigger.name,
      description,
      descriptionKey,
      descriptionParams: descriptionParams as Record<string, unknown>,
      severity: params.trigger.severity,
      thresholdValue: threshold.value,
      unit: threshold.unit,
    };

    return candidate;
  }
}
