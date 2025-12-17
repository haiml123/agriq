'use client';

import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { SeverityBadge } from './severity-badge';
import { ActionIcons } from './action-icons';
import { ConditionDisplay } from './condition-display';
import { getCommodityLabel, type Trigger } from '@/schemas/trigger.schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TriggerCardProps {
    trigger: Trigger;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}

export function TriggerCard({ trigger, onEdit, onDelete, onToggleActive }: TriggerCardProps) {
    return (
        <Card className={trigger.isActive ? '' : 'opacity-60'}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{trigger.name}</h3>
                            <SeverityBadge severity={trigger.severity} />
                            {!trigger.isActive && <Badge variant="secondary">Paused</Badge>}
                        </div>

                        {trigger.description && (
                            <p className="text-sm text-muted-foreground mb-3">{trigger.description}</p>
                        )}

                        {trigger.commodityTypeId && (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-medium uppercase text-muted-foreground">Commodity:</span>
                                <Badge variant="outline">
                                    {getCommodityLabel(trigger.commodityTypeId, trigger.commodityType)}
                                </Badge>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-medium uppercase text-muted-foreground">When:</span>
                            {trigger.conditions.map((condition, index) => (
                                <span key={condition.id} className="flex items-center gap-1">
                                    {index > 0 && (
                                        <span
                                            className={`px-2 py-0.5 text-xs font-bold rounded ${
                                                trigger.conditionLogic === 'AND'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            }`}
                                        >
                                            {trigger.conditionLogic}
                                        </span>
                                    )}
                                    <span className="px-2 py-1 rounded-lg bg-muted">
                                        <ConditionDisplay condition={condition} />
                                    </span>
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase text-muted-foreground">Then:</span>
                            <ActionIcons actions={trigger.actions} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleActive}
                            className={
                                trigger.isActive
                                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                                    : ''
                            }
                            title={trigger.isActive ? 'Pause trigger' : 'Activate trigger'}
                        >
                            {trigger.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onEdit} title="Edit trigger">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete trigger"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
