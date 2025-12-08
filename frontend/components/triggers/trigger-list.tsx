'use client';

import { TriggerCard } from './trigger-card';
import { EmptyState } from './empty-state';
import type { Trigger } from '@/schemas/trigger.schema';

interface TriggerListProps {
    triggers: Trigger[];
    onEdit: (trigger: Trigger) => void;
    onDelete: (trigger: Trigger) => void;
    onToggleActive: (trigger: Trigger) => void;
    onCreateTrigger: () => void;
}

export function TriggerList({
                                triggers,
                                onEdit,
                                onDelete,
                                onToggleActive,
                                onCreateTrigger,
                            }: TriggerListProps) {
    if (triggers.length === 0) {
        return <EmptyState onCreateTrigger={onCreateTrigger} />;
    }

    return (
        <div className="space-y-4">
            {triggers.map((trigger) => (
                <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    onEdit={() => onEdit(trigger)}
                    onDelete={() => onDelete(trigger)}
                    onToggleActive={() => onToggleActive(trigger)}
                />
            ))}
        </div>
    );
}