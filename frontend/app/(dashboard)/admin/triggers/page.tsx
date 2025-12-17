'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { TriggerModal } from '@/components/modals/trigger.modal';
import { TriggerList } from '@/components/triggers';
import type { Trigger } from '@/schemas/trigger.schema';
import { useTriggerApi } from '@/hooks/use-trigger-api';

export default function TriggersPage() {
    const modal = useModal();
    const {create} = useTriggerApi();
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const openTriggerModal = async (trigger?: Trigger) => {
        const result = await modal.open<Trigger | null>(
            (onClose) => <TriggerModal trigger={trigger} onClose={onClose} />,
            // { size: 'xl' }
        );

        await create(result);

        if (result) {
            if (trigger) {
                // Update existing trigger
                setTriggers((prev) => prev.map((t) => (t.id === result.id ? result : t)));
            } else {
                // Add new trigger
                setTriggers((prev) => [...prev, result]);
            }
        }
    };

    const handleDelete = async (trigger: Trigger) => {
        // TODO: Add confirmation dialog
        // TODO: Call API to delete
        setTriggers((prev) => prev.filter((t) => t.id !== trigger.id));
    };

    const handleToggleActive = async (trigger: Trigger) => {
        // TODO: Call API to toggle
        setTriggers((prev) =>
            prev.map((t) => (t.id === trigger.id ? { ...t, isActive: !t.isActive } : t))
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Event Triggers</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure automated alerts based on sensor conditions
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => openTriggerModal()}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Trigger
                </Button>
            </div>

            {/* Trigger List Card */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <p className="text-sm text-muted-foreground">
                        {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} configured
                    </p>
                </div>

                <div className="p-4">
                    <TriggerList
                        triggers={triggers}
                        onEdit={openTriggerModal}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                        onCreateTrigger={() => openTriggerModal()}
                    />
                </div>
            </div>
        </div>
    );
}
