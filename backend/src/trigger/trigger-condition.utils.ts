import { EventTrigger } from '@prisma/client';
import {
  ChangeDirection,
  ConditionSourceType,
  ConditionType,
  MetricType,
  Operator,
  ValueSource,
} from './dto';

export type TriggerCondition = {
  id: string;
  metric: MetricType;
  type: ConditionType;
  operator?: Operator;
  value?: number;
  secondaryValue?: number;
  changeDirection?: ChangeDirection;
  changeAmount?: number;
  timeWindowHours?: number;
  valueSources?: ValueSource[];
  sourceType?: ConditionSourceType;
};

export function parseTriggerConditions(
  conditions: EventTrigger['conditions'],
): TriggerCondition[] {
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

export function getMetricUnit(metric: MetricType): string {
  switch (metric) {
    case MetricType.TEMPERATURE:
    case MetricType.MEDIAN_TEMPERATURE:
      return 'C';
    case MetricType.HUMIDITY:
    case MetricType.EMC:
    case MetricType.MEDIAN_HUMIDITY:
      return '%';
    default:
      return '';
  }
}

export function formatConditionSummary(condition: TriggerCondition): string {
  if (condition.type === ConditionType.THRESHOLD) {
    if (condition.valueSources && condition.valueSources.length > 0) {
      const formattedSources = condition.valueSources.map((source) => {
        if (source === ValueSource.GATEWAY) return 'Gateway';
        if (source === ValueSource.OUTSIDE) return 'Outside';
        return source;
      });
      const sourceText =
        formattedSources.length === 1
          ? formattedSources[0]
          : formattedSources.join(' & ');
      const suffixMap: Partial<Record<MetricType, string>> = {
        [MetricType.TEMPERATURE]: 'temperature',
        [MetricType.MEDIAN_TEMPERATURE]: 'temperature',
        [MetricType.HUMIDITY]: 'humidity',
        [MetricType.MEDIAN_HUMIDITY]: 'humidity',
      };
      const suffix = suffixMap[condition.metric];
      return suffix
        ? `${condition.metric} from ${sourceText} ${suffix}`
        : `${condition.metric} from ${sourceText}`;
    }
    const unit = getMetricUnit(condition.metric);
    if (condition.operator === Operator.BETWEEN) {
      return `${condition.metric} between ${condition.value ?? ''}${unit} and ${condition.secondaryValue ?? ''}${unit}`;
    }
    return `${condition.metric} ${condition.operator ?? ''} ${condition.value ?? ''}${unit}`;
  }

  const unit = getMetricUnit(condition.metric);
  const direction = condition.changeDirection ?? ChangeDirection.ANY;
  return `${condition.metric} ${direction} by ${condition.changeAmount ?? ''}${unit}`;
}
