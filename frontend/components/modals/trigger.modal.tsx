'use client';

import { useState } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Trigger } from '@/schemas/trigger.schema';
import { TriggerEditorForm } from '@/components/triggers/trigger-editor/trigger-editor-form';
import type { Organization } from '@/schemas/organization.schema';

interface TriggerModalProps {
    trigger?: Trigger | null;
    onSubmit: (trigger: Trigger) => Promise<Trigger | null>;
    onClose: (result?: Trigger | null) => void;
    organizations?: Organization[];
    dialogClassName?: string;
}

export function TriggerModal({ trigger, onSubmit, onClose, organizations }: TriggerModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (data: Trigger) => {
        setIsLoading(true);
        try {
            const result = await onSubmit(data);
            onClose(result ?? null);
        } catch (error) {
            console.error('Failed to save trigger:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{trigger ? 'Edit Trigger' : 'Create New Trigger'}</DialogTitle>
                <DialogDescription>
                    {trigger
                        ? 'Update the trigger configuration and notification settings.'
                        : 'Set up conditions and actions for automated alerts.'}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto">
                <TriggerEditorForm
                    trigger={trigger || null}
                    onSave={handleSave}
                    onCancel={() => onClose()}
                    isLoading={isLoading}
                    organizations={organizations}
                />
            </div>
        </>
    );
}
