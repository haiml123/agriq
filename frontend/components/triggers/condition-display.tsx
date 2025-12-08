import type { Condition } from '@/schemas/trigger.schema';

interface ConditionDisplayProps {
    condition: Condition;
}

export function ConditionDisplay({ condition }: ConditionDisplayProps) {
    const metricLabel = condition.metric === 'TEMPERATURE' ? 'Temperature' : 'Humidity';
    const unit = condition.metric === 'TEMPERATURE' ? '°C' : '%';

    if (condition.type === 'THRESHOLD') {
        const operatorText: Record<string, string> = {
            ABOVE: 'is above',
            BELOW: 'is below',
            EQUALS: 'equals',
            BETWEEN: 'is between',
        };

        if (condition.operator === 'BETWEEN') {
            return (
                <span className="text-sm">
                    <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                    <span className="text-muted-foreground">{operatorText[condition.operator]}</span>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {condition.value}{unit}
                    </span>
                    <span className="text-muted-foreground"> and </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {condition.secondaryValue}{unit}
                    </span>
                </span>
            );
        }

        return (
            <span className="text-sm">
                <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                <span className="text-muted-foreground">{operatorText[condition.operator || 'ABOVE']}</span>{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.value}{unit}
                </span>
            </span>
        );
    }

    if (condition.type === 'CHANGE') {
        const directionText: Record<string, string> = {
            INCREASE: 'increases by',
            DECREASE: 'decreases by',
            ANY: 'changes by',
        };

        return (
            <span className="text-sm">
                <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                <span className="text-muted-foreground">{directionText[condition.changeDirection || 'ANY']}</span>{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.changeAmount}{unit}
                </span>
                <span className="text-muted-foreground"> in </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.timeWindowDays} days
                </span>
            </span>
        );
    }

    return null;
}