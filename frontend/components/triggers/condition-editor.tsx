'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConditionDisplay } from './condition-display';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Condition, ConditionTypeEnum, OperatorEnum } from '@/schemas/trigger.schema';
import { MetricTypeEnum } from '@/schemas/common.schema';

interface ConditionEditorProps {
    condition: Condition;
    onChange: (c: Condition) => void;
    onRemove: () => void;
    canRemove: boolean;
}

const SOURCE_OPTIONS = [
    { value: 'SENSOR', label: 'Sensor' },
    { value: 'GATEWAY', label: 'Gateway' },
    { value: 'OUTSIDE', label: 'Outside' },
] as const;

const METRIC_OPTIONS = [
    { value: MetricTypeEnum.TEMPERATURE, label: 'Temperature' },
    { value: MetricTypeEnum.MEDIAN_TEMPERATURE, label: 'Median Temperature' },
    { value: MetricTypeEnum.HUMIDITY, label: 'Humidity' },
    { value: MetricTypeEnum.MEDIAN_HUMIDITY, label: 'Median Humidity' },
    { value: MetricTypeEnum.EMC, label: 'EMC' },
] as const;

const METRICS_BY_SOURCE: Record<string, string[]> = {
    SENSOR: [
        MetricTypeEnum.TEMPERATURE,
        MetricTypeEnum.HUMIDITY,
        MetricTypeEnum.EMC,
        MetricTypeEnum.MEDIAN_TEMPERATURE,
        MetricTypeEnum.MEDIAN_HUMIDITY,
    ],
    GATEWAY: [MetricTypeEnum.TEMPERATURE, MetricTypeEnum.HUMIDITY],
    OUTSIDE: [MetricTypeEnum.TEMPERATURE, MetricTypeEnum.HUMIDITY],
};

const VALUE_SOURCE_METRICS = new Set<Condition['metric']>([
    MetricTypeEnum.TEMPERATURE,
    MetricTypeEnum.MEDIAN_TEMPERATURE,
    MetricTypeEnum.HUMIDITY,
    MetricTypeEnum.MEDIAN_HUMIDITY,
]);

export function ConditionEditor({
    condition,
    onChange,
    onRemove,
    canRemove,
}: ConditionEditorProps) {
    const sourceType = condition.sourceType ?? 'SENSOR';
    const availableMetrics = useMemo(() => {
        return METRIC_OPTIONS.filter((option) => METRICS_BY_SOURCE[sourceType]?.includes(option.value));
    }, [sourceType]);

    const updateField = (field: string, value: string | number | string[]) => {
        onChange({ ...condition, [field]: value });
    };

    useEffect(() => {
        const allowedMetrics = METRICS_BY_SOURCE[sourceType] || [];
        if (allowedMetrics.length > 0 && !allowedMetrics.includes(condition.metric)) {
            updateField('metric', allowedMetrics[0]);
        }
    }, [condition.metric, sourceType]);

    const valueSources = condition.valueSources ?? [];
    const showValueSourceOptions =
        condition.type === ConditionTypeEnum.THRESHOLD &&
        VALUE_SOURCE_METRICS.has(condition.metric) &&
        sourceType === 'SENSOR';
    const disableValueInputs = valueSources.length > 0;

    useEffect(() => {
        if (!showValueSourceOptions && valueSources.length > 0) {
            updateField('valueSources', []);
        }
    }, [showValueSourceOptions, valueSources.length]);

    useEffect(() => {
        if (!condition.sourceType) {
            updateField('sourceType', 'SENSOR');
        }
    }, [condition.sourceType]);

    const toggleValueSource = (sourceType: 'GATEWAY' | 'OUTSIDE') => {
        const nextSources = valueSources.includes(sourceType)
            ? valueSources.filter((item) => item !== sourceType)
            : [...valueSources, sourceType];
        updateField('valueSources', nextSources);
    };

    const unit =
        condition.metric === MetricTypeEnum.TEMPERATURE ||
        condition.metric === MetricTypeEnum.MEDIAN_TEMPERATURE
            ? '°C'
            : '%';

    return (
        <Card>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div className="space-y-2">
                            <Label>Source</Label>
                            <Select value={sourceType} onValueChange={(value) => updateField('sourceType', value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOURCE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Metric</Label>
                            <Select value={condition.metric} onValueChange={(v) => updateField('metric', v)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMetrics.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Condition Type</Label>
                            <Select
                                value={condition.type}
                                onValueChange={(v) => {
                                    if (v === 'THRESHOLD') {
                                        onChange({
                                            ...condition,
                                            type: 'THRESHOLD',
                                            operator: 'ABOVE',
                                            value: 30,
                                        });
                                    } else {
                                        onChange({
                                            ...condition,
                                            type: 'CHANGE',
                                            changeDirection: 'ANY',
                                            changeAmount: 5,
                                            timeWindowHours: 168,
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="THRESHOLD">Threshold (above/below)</SelectItem>
                                    <SelectItem value="CHANGE">Change over time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {condition.type === ConditionTypeEnum.THRESHOLD && (
                            <>
                                <div className="space-y-2">
                                    <Label>Operator</Label>
                                    <Select value={condition.operator} onValueChange={(v) => updateField('operator', v)}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ABOVE">Above</SelectItem>
                                            <SelectItem value="BELOW">Below</SelectItem>
                                            <SelectItem value="EQUALS">Equals</SelectItem>
                                            <SelectItem value="BETWEEN">Between</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{condition.operator === 'BETWEEN' ? 'Min Value' : 'Value'}</Label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={condition.value || ''}
                                            onChange={(e) => updateField('value', Number.parseFloat(e.target.value))}
                                            className="w-20"
                                            disabled={disableValueInputs}
                                        />
                                        <span className="text-sm text-muted-foreground">{unit}</span>
                                        {showValueSourceOptions && (
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <label className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        checked={valueSources.includes('GATEWAY')}
                                                        onCheckedChange={() => toggleValueSource('GATEWAY')}
                                                    />
                                                    Gateway
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        checked={valueSources.includes('OUTSIDE')}
                                                        onCheckedChange={() => toggleValueSource('OUTSIDE')}
                                                    />
                                                    Outside
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {condition.operator === OperatorEnum.BETWEEN && (
                                    <div className="space-y-2">
                                        <Label>Max Value</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={condition.secondaryValue || ''}
                                                onChange={(e) => updateField('secondaryValue', Number.parseFloat(e.target.value))}
                                                className="w-20"
                                                disabled={disableValueInputs}
                                            />
                                            <span className="text-sm text-muted-foreground">{unit}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {condition.type === ConditionTypeEnum.CHANGE && (
                            <>
                                <div className="space-y-2">
                                    <Label>Direction</Label>
                                    <Select value={condition.changeDirection} onValueChange={(v) => updateField('changeDirection', v)}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANY">Any change</SelectItem>
                                            <SelectItem value="INCREASE">Increase only</SelectItem>
                                            <SelectItem value="DECREASE">Decrease only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Change Amount</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={condition.changeAmount || ''}
                                            onChange={(e) => updateField('changeAmount', Number.parseFloat(e.target.value))}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">{unit}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Time Window</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={condition.timeWindowHours || ''}
                                            onChange={(e) => updateField('timeWindowHours', Number.parseInt(e.target.value))}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">hours</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {canRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRemove}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Preview: </span>
                    <ConditionDisplay
                        condition={condition}
                        valueSources={
                            showValueSourceOptions
                                ? [
                                    ...(valueSources.includes('GATEWAY') ? ['Gateway'] : []),
                                    ...(valueSources.includes('OUTSIDE') ? ['Outside'] : []),
                                ]
                                : undefined
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
