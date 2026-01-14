import { Injectable } from '@nestjs/common';
import { entity_status, EventTrigger, Prisma, trigger_scope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConditionType, MetricType } from './dto';

export interface TriggerContextScope {
  organizationId?: string;
  sensorId?: string;
  commodityTypeId?: string;
}

export type ReadingSource = 'GATEWAY' | 'SENSOR';

export interface BaselineQuery {
  source: ReadingSource;
  sourceId: string;
  since: Date;
  before?: Date;
  metrics: MetricType[];
}

type TriggerCondition = {
  id: string;
  metric: MetricType;
  type: ConditionType;
  time_window_days?: number;
};

@Injectable()
export class TriggerContextService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.eventTrigger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  getMaxChangeWindowDays(triggers: EventTrigger[]): number | null {
    const windows = triggers.flatMap((trigger) =>
      this.parseConditions(trigger.conditions)
        .filter((condition) => condition.type === ConditionType.CHANGE)
        .map((condition) => condition.time_window_days ?? 0),
    );

    const maxWindow = windows.length > 0 ? Math.max(...windows) : 0;
    return maxWindow > 0 ? maxWindow : null;
  }

  async loadBaselineMetrics(
    query: BaselineQuery,
  ): Promise<Partial<Record<MetricType, number>>> {
    const metrics = new Set(query.metrics);
    const baseline: Partial<Record<MetricType, number>> = {};

    if (metrics.size === 0) {
      return baseline;
    }

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
        this.assignMetricValue(baseline, MetricType.HUMIDITY, reading.humidity);
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
        this.assignMetricValue(baseline, MetricType.HUMIDITY, reading.humidity);
      }
    }

    return baseline;
  }

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

  private parseConditions(conditions: EventTrigger['conditions']): TriggerCondition[] {
    if (!Array.isArray(conditions)) {
      return [];
    }

    return conditions.filter((condition): condition is TriggerCondition => {
      if (!condition || typeof condition !== 'object') {
        return false;
      }

      const candidate = condition as Record<string, unknown>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.metric === 'string' &&
        typeof candidate.type === 'string'
      );
    });
  }

  getChangeMetricWindows(trigger: EventTrigger): Map<MetricType, number> {
    const windows = new Map<MetricType, number>();

    this.parseConditions(trigger.conditions)
      .filter((condition) => condition.type === ConditionType.CHANGE)
      .forEach((condition) => {
        const windowDays = condition.time_window_days ?? 1;
        const existing = windows.get(condition.metric) ?? 0;
        if (windowDays > existing) {
          windows.set(condition.metric, windowDays);
        }
      });

    return windows;
  }
}
