'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { TriggerModal } from '@/components/modals/trigger.modal';
import { TriggerList } from '@/components/triggers';
import type { Trigger } from '@/schemas/trigger.schema';
import { useTriggerApi } from '@/hooks/use-trigger-api';
import { useOrganizationApi } from '@/hooks/use-organization-api';
import type { Organization } from '@/schemas/organization.schema';

export default function TriggersPage() {
    const modal = useModal();
    const { getList, create, update, toggleActive, remove, isLoading: isApiLoading } = useTriggerApi();
    const { getList: getOrganizationList, isLoading: isOrgLoading } = useOrganizationApi();
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    const loadTriggers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getList();
            if (response?.data?.items) {
                setTriggers(response.data.items);
            }
        } finally {
            setIsLoading(false);
        }
    }, [getList]);

    useEffect(() => {
        void loadTriggers();
    }, [loadTriggers]);

    useEffect(() => {
        const loadOrganizations = async () => {
            const response = await getOrganizationList();
            if (response?.data?.items) {
                setOrganizations(response.data.items);
            }
        };
        void loadOrganizations();
    }, [getOrganizationList]);

    const saveTrigger = useCallback(
        async (payload: Trigger, existing?: Trigger | null) => {
            const response = existing
                ? await update(existing.id, payload)
                : await create(payload);
            return response?.data ?? null;
        },
        [create, update]
    );

    const openTriggerModal = async (trigger?: Trigger) => {
        const result = await modal.open<Trigger | null>(
            (onClose) => (
                <TriggerModal
                    trigger={trigger}
                    onSubmit={(data) => saveTrigger(data, trigger ?? null)}
                    onClose={onClose}
                    organizations={organizations}
                />
            ),
            // { size: 'xl' }
        );
        if (result) {
            setTriggers((prev) => {
                const exists = prev.some((t) => t.id === result.id);
                if (exists) {
                    return prev.map((t) => (t.id === result.id ? result : t));
                }
                return [...prev, result];
            });
        }
    };

    const handleDelete = async (trigger: Trigger) => {
        const response = await remove(trigger.id);
        if (!response?.error) {
            setTriggers((prev) => prev.filter((t) => t.id !== trigger.id));
        }
    };

    const handleToggleActive = async (trigger: Trigger) => {
        const response = await toggleActive(trigger.id, !trigger.isActive);
        if (response?.data) {
            const updatedTrigger = response.data;
            setTriggers((prev) =>
                prev.map((t) => (t.id === trigger.id ? updatedTrigger : t))
            );
        }
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
                    {isLoading || isApiLoading || isOrgLoading ? (
                        <p className="text-sm text-muted-foreground">Loading triggers...</p>
                    ) : (
                        <TriggerList
                            triggers={triggers}
                            onEdit={openTriggerModal}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                            onCreateTrigger={() => openTriggerModal()}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
