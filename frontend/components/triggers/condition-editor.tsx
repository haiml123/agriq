'use client';

import { Trash2 } from 'lucide-react';
import { ConditionDisplay } from './condition-display';
import { Button } from '@/components/ui/button';
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

export function ConditionEditor({ condition, onChange, onRemove, canRemove }: ConditionEditorProps) {
    const updateField = (field: string, value: string | number) => {
        onChange({ ...condition, [field]: value });
    };

    const unit = condition.metric === MetricTypeEnum.TEMPERATURE ? '°C' : '%';

    return (
        <Card>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div className="space-y-2">
                            <Label>Metric</Label>
                            <Select value={condition.metric} onValueChange={(v) => updateField('metric', v)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEMPERATURE">Temperature</SelectItem>
                                    <SelectItem value="HUMIDITY">Humidity</SelectItem>
                                    <SelectItem value="EMC">EMC</SelectItem>
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
                                            timeWindowDays: 7,
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
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={condition.value || ''}
                                            onChange={(e) => updateField('value', Number.parseFloat(e.target.value))}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">{unit}</span>
                                    </div>
                                </div>
                                {condition.operator === OperatorEnum.BETWEEN && (
                                    <div className="space-y-2">
                                        <Label>Max Value</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={condition.secondaryValue || ''}
                                                onChange={(e) => updateField('secondaryValue', Number.parseFloat(e.target.value))}
                                                className="w-20"
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
                                            value={condition.timeWindowDays || ''}
                                            onChange={(e) => updateField('timeWindowDays', Number.parseInt(e.target.value))}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">days</span>
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
                    <ConditionDisplay condition={condition} />
                </div>
            </CardContent>
        </Card>
    );
}