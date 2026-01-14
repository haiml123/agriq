import { EventTrigger } from '@prisma/client';
import { ChangeDirection, ConditionType, MetricType, Operator } from './dto';

export type TriggerCondition = {
  id: string;
  metric: MetricType;
  type: ConditionType;
  operator?: Operator;
  value?: number;
  secondary_value?: number;
  change_direction?: ChangeDirection;
  change_amount?: number;
  time_window_days?: number;
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
      return 'C';
    case MetricType.HUMIDITY:
    case MetricType.EMC:
      return '%';
    default:
      return '';
  }
}

export function formatConditionSummary(condition: TriggerCondition): string {
  if (condition.type === ConditionType.THRESHOLD) {
    const unit = getMetricUnit(condition.metric);
    if (condition.operator === Operator.BETWEEN) {
      return `${condition.metric} between ${condition.value ?? ''}${unit} and ${condition.secondary_value ?? ''}${unit}`;
    }
    return `${condition.metric} ${condition.operator ?? ''} ${condition.value ?? ''}${unit}`;
  }

  const unit = getMetricUnit(condition.metric);
  const direction = condition.change_direction ?? ChangeDirection.ANY;
  return `${condition.metric} ${direction} by ${condition.change_amount ?? ''}${unit}`;
}
