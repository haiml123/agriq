'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { TriggerModal } from '@/components/modals/trigger.modal';
import { useTriggerApi } from '@/hooks/use-trigger-api';
import { useOrganizationApi } from '@/hooks/use-organization-api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Trigger } from './types';
import type { Organization } from '@/schemas/organization.schema';

export function TriggersPage() {
    const modal = useModal();
    const t = useTranslations('toast.trigger');
    const { getList, create, update, toggleActive, remove, isLoading, isUpdating, isDeleting } = useTriggerApi();
    const { getList: getOrganizations } = useOrganizationApi();
    const [triggers, setTriggers] = useState<Trigger[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    const refreshList = async () => {
        const response = await getList();
        if (response?.data?.items) {
            setTriggers(response.data.items as Trigger[]);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    useEffect(() => {
        const loadOrganizations = async () => {
            const response = await getOrganizations({ limit: 100 });
            if (response?.data?.items) {
                setOrganizations(response.data.items);
            }
        };

        loadOrganizations();
    }, [getOrganizations]);

    const handleToggleStatus = async (trigger: Trigger) => {
        try {
            const result = await toggleActive(trigger.id, !trigger.isActive);
            if (result?.data) {
                toast.success(t('statusChangeSuccess'));
                await refreshList();
            } else {
                toast.error(result?.error || t('statusChangeError'));
            }
        } catch (error) {
            toast.error(t('statusChangeError'));
        }
    };

    const handleDeleteTrigger = async (id: string) => {
        try {
            const result = await remove(id);
            if (result?.data) {
                toast.success(t('deleteSuccess'));
                await refreshList();
            } else {
                toast.error(result?.error || t('deleteError'));
            }
        } catch (error) {
            toast.error(t('deleteError'));
        }
    };

    const createOrEditTrigger = async (editTrigger?: Trigger) => {
        const result = await modal.open<Trigger | null>((onClose) => (
            <TriggerModal
                trigger={editTrigger ?? null}
                onClose={onClose}
                onSubmit={async (data) => {
                    if (editTrigger?.id) {
                        const response = await update(editTrigger.id, data);
                        if (response?.data) {
                            toast.success(t('updateSuccess'));
                            return response.data as Trigger;
                        }
                        toast.error(response?.error || t('updateError'));
                        return null;
                    }
                    const response = await create(data);
                    if (response?.data) {
                        toast.success(t('createSuccess'));
                        return response.data as Trigger;
                    }
                    toast.error(response?.error || t('createError'));
                    return null;
                }}
                organizations={organizations}
            />
        ));
        if (result) {
            await refreshList();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Triggers</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage alert triggers and thresholds</p>
                    </div>
                </div>
                <Button onClick={() => createOrEditTrigger()} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Trigger
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">All Triggers</h2>
                    <p className="text-sm text-muted-foreground">
                        {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} configured
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {triggers.map((trigger) => (
                        <div key={trigger.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">{trigger.name}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(trigger)}
                                            disabled={isUpdating}
                                        >
                                            {trigger.isActive ? (
                                                <PowerOff className="w-4 h-4" />
                                            ) : (
                                                <Power className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => createOrEditTrigger(trigger)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTrigger(trigger.id)}
                                            disabled={isDeleting}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {triggers.length === 0 && (
                    <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No triggers yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first trigger</p>
                        <Button onClick={() => createOrEditTrigger()} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Trigger
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
