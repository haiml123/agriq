import { Injectable } from '@nestjs/common';
import { EventTrigger } from '@prisma/client';
import {
  ChangeDirection,
  ConditionLogic,
  ConditionType,
  MetricType,
  Operator,
} from './dto';
import { parseTriggerConditions } from './trigger-condition.utils';
import type {
  TriggerCondition,
  TriggerEvaluationContext,
  TriggerEvaluationResult,
} from './trigger.type';

@Injectable()
export class TriggerEvaluatorService {
  /**
   * Evaluate a trigger against the provided metric context.
   */
  evaluateTrigger(
    trigger: Pick<EventTrigger, 'conditions' | 'conditionLogic'>,
    context: TriggerEvaluationContext,
  ): TriggerEvaluationResult {
    const conditions = parseTriggerConditions(trigger.conditions);

    if (conditions.length === 0) {
      return { matches: false, matchedConditions: [], failedConditions: [] };
    }

    const logic =
      trigger.conditionLogic === ConditionLogic.OR
        ? ConditionLogic.OR
        : ConditionLogic.AND;

    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];

    // Evaluate each condition independently.
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

  /**
   * Dispatch evaluation by condition type.
   */
  private evaluateCondition(
    condition: TriggerCondition,
    context: TriggerEvaluationContext,
  ): boolean {
    const current = context.metrics[condition.metric];
    if (current === undefined || Number.isNaN(current)) {
      return false;
    }

    return this.evaluateConditionForValue(
      condition,
      current,
      context.previousMetrics,
    );
  }

  /**
   * Evaluate a condition given current + previous metric values.
   */
  evaluateConditionForValue(
    condition: TriggerCondition,
    current: number,
    previousMetrics?: Partial<Record<MetricType, number>>,
  ): boolean {
    if (condition.type === ConditionType.THRESHOLD) {
      return this.evaluateThreshold(condition, current);
    }

    if (condition.type === ConditionType.CHANGE) {
      return this.evaluateChange(condition, current, previousMetrics);
    }

    return false;
  }

  /**
   * Evaluate threshold comparisons (ABOVE/BELOW/BETWEEN/etc).
   */
  private evaluateThreshold(
    condition: TriggerCondition,
    current: number,
  ): boolean {
    const { operator, value, secondaryValue } = condition;

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
        if (secondaryValue === undefined) {
          return false;
        }
        const min = Math.min(value, secondaryValue);
        const max = Math.max(value, secondaryValue);
        return current >= min && current <= max;
      }
      default:
        return false;
    }
  }

  /**
   * Evaluate change-over-time conditions against a baseline.
   */
  private evaluateChange(
    condition: TriggerCondition,
    current: number,
    previousMetrics?: Partial<Record<MetricType, number>>,
  ): boolean {
    const previous = previousMetrics?.[condition.metric];
    const changeAmount = condition.changeAmount ?? 0;

    if (previous === undefined || Number.isNaN(previous)) {
      return false;
    }

    const delta = current - previous;

    switch (condition.changeDirection) {
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
