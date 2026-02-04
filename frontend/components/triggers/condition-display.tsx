import { ConditionTypeEnum, OperatorEnum } from '@/schemas/trigger.schema';
import type { Condition } from '@/schemas/trigger.schema';

interface ConditionDisplayProps {
    condition: Condition;
    valueSources?: string[];
}

export function ConditionDisplay({ condition, valueSources }: ConditionDisplayProps) {
    const resolvedValueSources = valueSources ?? condition.valueSources;
    const sourceLabelMap: Record<string, string> = {
        SENSOR: 'sensor',
        GATEWAY: 'gateway',
        OUTSIDE: 'outside',
    };
    const sourceLabel = sourceLabelMap[condition.sourceType ?? 'SENSOR'] ?? condition.sourceType ?? 'sensor';
    const metricLabelMap: Record<string, string> = {
        TEMPERATURE: 'Temperature',
        HUMIDITY: 'Humidity',
        EMC: 'EMC',
        MEDIAN_TEMPERATURE: 'Median Temperature',
        MEDIAN_HUMIDITY: 'Median Humidity',
    };
    const unitMap: Record<string, string> = {
        TEMPERATURE: '°C',
        HUMIDITY: '%',
        EMC: '%',
        MEDIAN_TEMPERATURE: '°C',
        MEDIAN_HUMIDITY: '%',
    };
    const metricLabel = metricLabelMap[condition.metric] ?? condition.metric;
    const unit = unitMap[condition.metric] ?? '';

    if (condition.type === ConditionTypeEnum.THRESHOLD) {
        if (resolvedValueSources && resolvedValueSources.length > 0) {
            const formattedSources = resolvedValueSources.map((source) => {
                if (source === 'GATEWAY') return 'Gateway';
                if (source === 'OUTSIDE') return 'Outside';
                return source;
            });
            const sourceText =
                formattedSources.length === 1
                    ? formattedSources[0]
                    : formattedSources.join(' & ');
            const suffixMap: Record<string, string> = {
                TEMPERATURE: 'temperature',
                MEDIAN_TEMPERATURE: 'temperature',
                HUMIDITY: 'humidity',
                MEDIAN_HUMIDITY: 'humidity',
            };
            const sourceMetricSuffix = suffixMap[condition.metric];

            const operatorText: Record<string, string> = {
                [OperatorEnum.ABOVE]: 'is above',
                [OperatorEnum.BELOW]: 'is below',
                [OperatorEnum.EQUALS]: 'equals',
                [OperatorEnum.BETWEEN]: 'is between',
            };

            return (
                <span className="text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{sourceLabel} </span>
                    <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                    <span className="text-muted-foreground">
                        {operatorText[condition.operator || OperatorEnum.ABOVE]} from
                    </span>{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {sourceText}
                    </span>
                    {sourceMetricSuffix && (
                        <span className="text-muted-foreground"> {sourceMetricSuffix}</span>
                    )}
                </span>
            );
        }

        const operatorText: Record<string, string> = {
            [OperatorEnum.ABOVE]: 'is above',
            [OperatorEnum.BELOW]: 'is below',
            [OperatorEnum.EQUALS]: 'equals',
            [OperatorEnum.BETWEEN]: 'is between',
        };

        if (condition.operator === OperatorEnum.BETWEEN) {
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
                <span className="text-blue-600 dark:text-blue-400 font-medium">{sourceLabel} </span>
                <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                <span className="text-muted-foreground">{operatorText[condition.operator || OperatorEnum.ABOVE]}</span>{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.value}{unit}
                </span>
            </span>
        );
    }

    if (condition.type === ConditionTypeEnum.CHANGE) {
        const directionText: Record<string, string> = {
            INCREASE: 'increases by',
            DECREASE: 'decreases by',
            ANY: 'changes by',
        };

        return (
            <span className="text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">{sourceLabel} </span>
                <span className="font-medium text-foreground">{metricLabel}</span>{' '}
                <span className="text-muted-foreground">
                    {directionText[condition.changeDirection || 'ANY']}
                </span>{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.changeAmount}{unit}
                </span>
                <span className="text-muted-foreground"> in </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {condition.timeWindowHours} hours
                </span>
            </span>
        );
    }

    return null;
}
