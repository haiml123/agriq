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
import {
  parseTriggerConditions,
  TriggerCondition,
} from './trigger-condition.utils';
import {
  calculateEmc,
  calculateMedian,
  getMetricUnit,
  getMetricValueFromReading,
} from './trigger-metrics.util';

type LookupTableData = {
  tempRanges: number[];
  humidityRanges: number[];
  values: number[][];
};

type Reading = { temperature: number; humidity: number; recordedAt: Date };
type BallReading = Reading & { id: string; macId?: string };

type TriggerScope = {
  organizationId?: string;
  commodityTypeId?: string;
  siteId?: string;
  compoundId?: string;
  cellId?: string;
  sensorId?: string;
  gatewayId?: string;
};

type EvaluationInputs = {
  gateway?: Reading;
  outside?: Reading;
  balls?: BallReading[];
  sensorIdByExternal?: Map<string, string>;
  recordedAt: Date;
};

type SourceWindow = {
  sensorHours: number;
  gatewayHours: number;
  outsideHours: number;
};

type HistoryCache = {
  sensorHistoryById: Map<string, Reading[]>;
  gatewayHistory: Reading[];
  outsideHistory: Reading[];
};

type AlertCandidate = {
  triggerId: string;
  siteId: string;
  compoundId?: string | null;
  cellId?: string | null;
  sensorId?: string | null;
  organizationId?: string | null;
  title: string;
  description: string;
  descriptionKey: string;
  descriptionParams: Record<string, unknown>;
  severity: string;
  thresholdValue?: number;
  unit?: string;
};

type AlertWriter = (candidate: AlertCandidate) => Promise<void> | void;

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
   * Evaluate sensor-specific triggers for a single sensor reading.
   * This is used for the sensor ingestion endpoint (single sensor).
   */
  async evaluateSensorReading(
    scope: TriggerScope,
    reading: Reading,
  ): Promise<void> {
    if (!scope.sensorId || !scope.cellId || !scope.siteId) {
      return;
    }

    const triggers = await this.triggerContext.findMatchingTriggers(
      {
        organizationId: scope.organizationId,
        commodityTypeId: scope.commodityTypeId,
        sensorId: scope.sensorId,
      },
      { sensorMatch: 'specific' },
    );

    if (triggers.length === 0) {
      return;
    }

    const lookupTable = scope.commodityTypeId
      ? await this.getLookupTable(scope.commodityTypeId)
      : undefined;
    const emc = lookupTable
      ? calculateEmc(lookupTable, reading.temperature, reading.humidity)
      : undefined;

    const metrics: Partial<Record<MetricType, number>> = {
      [MetricType.TEMPERATURE]: reading.temperature,
      [MetricType.MEDIAN_TEMPERATURE]: reading.temperature,
      [MetricType.HUMIDITY]: reading.humidity,
      [MetricType.MEDIAN_HUMIDITY]: reading.humidity,
      ...(emc !== undefined && { [MetricType.EMC]: emc }),
    };

    for (const trigger of triggers) {
      const changeWindows = this.triggerContext.getChangeMetricWindows(trigger);
      const previousMetrics: Partial<Record<MetricType, number>> = {};

      for (const [metric, windowHours] of changeWindows.entries()) {
        const baseline = await this.triggerContext.loadBaselineMetrics({
          source: 'SENSOR',
          sourceId: scope.sensorId,
          since: new Date(reading.recordedAt.getTime() - windowHours * 60 * 60 * 1000),
          before: reading.recordedAt,
          metrics: [metric],
        });

        if (baseline[metric] !== undefined) {
          previousMetrics[metric] = baseline[metric] as number;
        }

        if (
          metric === MetricType.EMC &&
          baseline[MetricType.TEMPERATURE] !== undefined &&
          baseline[MetricType.HUMIDITY] !== undefined &&
          lookupTable
        ) {
          const baselineEmc = calculateEmc(
            lookupTable,
            baseline[MetricType.TEMPERATURE] as number,
            baseline[MetricType.HUMIDITY] as number,
          );
          if (baselineEmc !== undefined) {
            previousMetrics[MetricType.EMC] = baselineEmc;
          }
        }
      }

      const evaluation = this.evaluator.evaluateTrigger(trigger, {
        metrics,
        previousMetrics:
          Object.keys(previousMetrics).length > 0 ? previousMetrics : undefined,
      });

      if (!evaluation.matches) {
        continue;
      }

      await this.ensureAlertForTrigger({
        trigger,
        siteId: scope.siteId,
        compoundId: scope.compoundId,
        cellId: scope.cellId,
        sensorId: scope.sensorId,
        organizationId: scope.organizationId,
        matchedConditionIds: evaluation.matchedConditions,
      });
    }
  }

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
    },
  ): Promise<void> {
    if (!scope.cellId || !scope.siteId) {
      return;
    }

    this.logger.debug(
      `engine: evaluate gateway payload cell=${scope.cellId} site=${scope.siteId} gateway=${scope.gatewayId ?? 'none'} recordedAt=${inputs.recordedAt.toISOString()}`,
    );

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

    const lookupTable = scope.commodityTypeId
      ? await this.getLookupTable(scope.commodityTypeId)
      : undefined;
    const maxWindows = this.getMaxWindows(triggers);
    const histories = await this.loadHistories(scope, inputs, maxWindows);

    for (const trigger of triggers) {
      const conditions = parseTriggerConditions(trigger.conditions);
      const matchedConditionIds: string[] = [];
      const failedConditionIds: string[] = [];

      for (const condition of conditions) {
        const sources = this.resolveSources(condition);
        let conditionMatched = false;

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

      await this.ensureAlertForTrigger({
        trigger,
        siteId: scope.siteId,
        compoundId: scope.compoundId,
        cellId: scope.cellId,
        organizationId: scope.organizationId,
        matchedConditionIds,
      }, options);
    }
  }

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
      return this.evaluateSensorCondition(
        condition,
        inputs,
        lookupTable,
        histories.sensorHistoryById,
      );
    }

    if (source === ConditionSourceType.OUTSIDE) {
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
      return this.evaluateSensorChangeCondition(
        condition,
        inputs,
        lookupTable,
        historyBySensorId,
      );
    }

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

  private async evaluateSensorChangeCondition(
    condition: TriggerCondition,
    inputs: EvaluationInputs,
    lookupTable?: LookupTableData,
    historyBySensorId?: Map<string, Reading[]>,
  ): Promise<boolean> {
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
        ? this.findBaselineReading(
            historyBySensorId.get(sensorId),
            windowStart,
          )
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

  private async evaluateScalarCondition(
    condition: TriggerCondition,
    reading: Reading,
    lookupTable: LookupTableData | undefined,
    history: Reading[],
    baselineRequest: {
      source: 'GATEWAY' | 'OUTSIDE';
      sourceId: string;
      recordedAt: Date;
    },
  ): Promise<boolean> {
    if (condition.type === ConditionType.THRESHOLD) {
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

  private isMedianMetric(metric: MetricType): boolean {
    return (
      metric === MetricType.MEDIAN_TEMPERATURE ||
      metric === MetricType.MEDIAN_HUMIDITY
    );
  }

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

  private async loadHistories(
    scope: TriggerScope,
    inputs: EvaluationInputs,
    windows: SourceWindow,
  ): Promise<HistoryCache> {
    const sensorHistoryById = new Map<string, Reading[]>();
    const gatewayHistory: Reading[] = [];
    let outsideHistory: Reading[] = [];

    const end = inputs.recordedAt;

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

    return { sensorHistoryById, gatewayHistory, outsideHistory };
  }

  private findBaselineReading(
    readings: Reading[] | undefined,
    windowStart: Date,
  ): Reading | undefined {
    if (!readings || readings.length === 0) {
      return undefined;
    }
    return readings.find((reading) => reading.recordedAt >= windowStart);
  }

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
        sourceType:
          condition.sourceType ?? raw.sourceType ?? raw.source_type,
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

  private getAlertThreshold(
    matchedConditions: TriggerCondition[],
  ): { value?: number; unit?: string } {
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
    },
  ) {
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
        return existing;
      }
    }

    const conditions = parseTriggerConditions(params.trigger.conditions);
    const matchedConditions = conditions.filter((condition) =>
      params.matchedConditionIds.includes(condition.id),
    );

    const { description, descriptionKey, descriptionParams } =
      this.buildAlertDescriptionPayload(
        params.trigger.name,
        matchedConditions,
      );
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

    if (options?.alertWriter) {
      await options.alertWriter(candidate);
      return candidate;
    }

    return this.prisma.alert.create({
      data: {
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
      },
    });
  }
}
