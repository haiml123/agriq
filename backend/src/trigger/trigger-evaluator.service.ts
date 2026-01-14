import { Injectable } from '@nestjs/common';
import { EventTrigger } from '@prisma/client';
import {
  ChangeDirection,
  ConditionLogic,
  ConditionType,
  MetricType,
  Operator,
} from './dto';

export interface TriggerEvaluationContext {
  metrics: Partial<Record<MetricType, number>>;
  previousMetrics?: Partial<Record<MetricType, number>>;
}

export interface TriggerEvaluationResult {
  matches: boolean;
  matchedConditions: string[];
  failedConditions: string[];
}

type TriggerCondition = {
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

@Injectable()
export class TriggerEvaluatorService {
  evaluateTrigger(
    trigger: Pick<EventTrigger, 'conditions' | 'conditionLogic'>,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    const conditions = this.parseConditions(trigger.conditions);

    if (conditions.length === 0) {
      return { matches: false, matchedConditions: [], failedConditions: [] };
    }

    const logic =
      trigger.conditionLogic === ConditionLogic.OR
        ? ConditionLogic.OR
        : ConditionLogic.AND;

    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];

    conditions.forEach((condition) => {
      const isMatch = this.evaluateCondition(condition, context);
      if (isMatch) {
        matchedConditions.push(condition.id);
      } else {
        failedConditions.push(condition.id);
      }
    });

    const matches =
      logic === ConditionLogic.AND
        ? failedConditions.length === 0
        : matchedConditions.length > 0;

    return { matches, matchedConditions, failedConditions };
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

  private evaluateCondition(
    condition: TriggerCondition,
    context: TriggerEvaluationContext,
  ): boolean {
    const current = context.metrics[condition.metric];
    if (current === undefined || Number.isNaN(current)) {
      return false;
    }

    if (condition.type === ConditionType.THRESHOLD) {
      return this.evaluateThreshold(condition, current);
    }

    if (condition.type === ConditionType.CHANGE) {
      return this.evaluateChange(condition, current, context.previousMetrics);
    }

    return false;
  }

  private evaluateThreshold(condition: TriggerCondition, current: number): boolean {
    const { operator, value, secondary_value } = condition;

    if (!operator || value === undefined) {
      return false;
    }

    switch (operator) {
      case Operator.ABOVE:
        return current > value;
      case Operator.BELOW:
        return current < value;
      case Operator.EQUALS:
        return current === value;
      case Operator.BETWEEN: {
        if (secondary_value === undefined) {
          return false;
        }
        const min = Math.min(value, secondary_value);
        const max = Math.max(value, secondary_value);
        return current >= min && current <= max;
      }
      default:
        return false;
    }
  }

  private evaluateChange(
    condition: TriggerCondition,
    current: number,
    previousMetrics?: Partial<Record<MetricType, number>>,
  ): boolean {
    const previous = previousMetrics?.[condition.metric];
    const changeAmount = condition.change_amount ?? 0;

    if (previous === undefined || Number.isNaN(previous)) {
      return false;
    }

    const delta = current - previous;

    switch (condition.change_direction) {
      case ChangeDirection.INCREASE:
        return delta >= changeAmount;
      case ChangeDirection.DECREASE:
        return delta <= -changeAmount;
      case ChangeDirection.ANY:
      default:
        return Math.abs(delta) >= changeAmount;
    }
  }
}
