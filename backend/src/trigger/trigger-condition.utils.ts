import { EventTrigger } from '@prisma/client';
import type { TriggerCondition } from './trigger.type';

/**
 * Normalize conditions JSON to a safe array of TriggerCondition objects.
 */
export function parseTriggerConditions(
  conditions: EventTrigger['conditions'],
): TriggerCondition[] {
  // Guard against malformed JSON from DB.
  if (!Array.isArray(conditions)) {
    return [];
  }

  // Keep only objects that look like valid conditions.
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
