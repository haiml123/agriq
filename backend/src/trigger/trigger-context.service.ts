import { Injectable } from '@nestjs/common';
import {
  entity_status,
  EventTrigger,
  Prisma,
  trigger_scope,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConditionType, MetricType } from './dto';
import { parseTriggerConditions } from './trigger-condition.utils';
import type { BaselineQuery, TriggerContextScope } from './trigger.type';

@Injectable()
export class TriggerContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load active triggers that match scope + sensor specificity.
   */
  async findMatchingTriggers(
    scope: TriggerContextScope,
    options?: { sensorMatch?: 'any' | 'specific' | 'generic' },
  ): Promise<EventTrigger[]> {
    const sensorMatch = options?.sensorMatch ?? 'any';
    const where: Prisma.EventTriggerWhereInput = {
      isActive: true,
      status: entity_status.ACTIVE,
      ...(scope.commodityTypeId && { commodityTypeId: scope.commodityTypeId }),
    };

    const scopeFilters: Prisma.EventTriggerWhereInput[] = [
      { scopeType: trigger_scope.ALL },
    ];

    if (scope.organizationId) {
      scopeFilters.push({
        scopeType: trigger_scope.ORGANIZATION,
        organizationId: scope.organizationId,
      });
    }

    where.OR = scopeFilters;

    if (sensorMatch === 'generic') {
      where.sensorId = null;
    } else if (sensorMatch === 'specific') {
      if (!scope.sensorId) {
        return [];
      }
      where.sensorId = scope.sensorId;
    } else if (scope.sensorId) {
      where.AND = [{ OR: [{ sensorId: null }, { sensorId: scope.sensorId }] }];
    } else {
      where.sensorId = null;
    }

    // Query only matching, active triggers.
    return this.prisma.eventTrigger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Build baseline metrics for change-over-time conditions.
   */
  async loadBaselineMetrics(
    query: BaselineQuery,
  ): Promise<Partial<Record<MetricType, number>>> {
    const metrics = new Set(query.metrics);
    const baseline: Partial<Record<MetricType, number>> = {};

    if (metrics.size === 0) {
      return baseline;
    }

    // Pull the earliest reading within the window for the requested source.
    if (query.source === 'GATEWAY') {
      const reading = await this.prisma.gatewayReading.findFirst({
        where: {
          gatewayId: query.sourceId,
          recordedAt: {
            gte: query.since,
            ...(query.before && { lt: query.before }),
          },
        },
        orderBy: { recordedAt: 'asc' },
        select: { temperature: true, humidity: true },
      });

      if (reading) {
        this.assignMetricValue(
          baseline,
          MetricType.TEMPERATURE,
          reading.temperature,
        );
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_TEMPERATURE,
          reading.temperature,
        );
        this.assignMetricValue(baseline, MetricType.HUMIDITY, reading.humidity);
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_HUMIDITY,
          reading.humidity,
        );
      }
    }

    if (query.source === 'OUTSIDE') {
      const observation = await this.prisma.weatherObservation.findFirst({
        where: {
          siteId: query.sourceId,
          recordedAt: {
            gte: query.since,
            ...(query.before && { lt: query.before }),
          },
        },
        orderBy: { recordedAt: 'asc' },
        select: { temperature: true, humidity: true },
      });

      if (observation) {
        this.assignMetricValue(
          baseline,
          MetricType.TEMPERATURE,
          observation.temperature,
        );
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_TEMPERATURE,
          observation.temperature,
        );
        this.assignMetricValue(
          baseline,
          MetricType.HUMIDITY,
          observation.humidity,
        );
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_HUMIDITY,
          observation.humidity,
        );
      }
    }

    if (query.source === 'SENSOR') {
      const reading = await this.prisma.sensorReading.findFirst({
        where: {
          sensorId: query.sourceId,
          recordedAt: {
            gte: query.since,
            ...(query.before && { lt: query.before }),
          },
        },
        orderBy: { recordedAt: 'asc' },
        select: { temperature: true, humidity: true },
      });

      if (reading) {
        this.assignMetricValue(
          baseline,
          MetricType.TEMPERATURE,
          reading.temperature,
        );
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_TEMPERATURE,
          reading.temperature,
        );
        this.assignMetricValue(baseline, MetricType.HUMIDITY, reading.humidity);
        this.assignMetricValue(
          baseline,
          MetricType.MEDIAN_HUMIDITY,
          reading.humidity,
        );
      }
    }

    return baseline;
  }

  /**
   * Assign a metric when the value is valid.
   */
  private assignMetricValue(
    target: Partial<Record<MetricType, number>>,
    metric: MetricType,
    value: number | null | undefined,
  ) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return;
    }
    target[metric] = value;
  }

  /**
   * Compute the max time window needed per metric for a trigger.
   */
  getChangeMetricWindows(trigger: EventTrigger): Map<MetricType, number> {
    const windows = new Map<MetricType, number>();

    // Consider only change-type conditions.
    parseTriggerConditions(trigger.conditions)
      .filter((condition) => condition.type === ConditionType.CHANGE)
      .forEach((condition) => {
        const windowHours = condition.timeWindowHours ?? 1;
        const existing = windows.get(condition.metric) ?? 0;
        if (windowHours > existing) {
          windows.set(condition.metric, windowHours);
        }
      });

    return windows;
  }
}
