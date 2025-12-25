'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table2, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
// import { LookupTableModal } from '@/components/modals/lookup-table.modal';
import { useLookupTableApi } from '@/hooks/use-lookup-table-api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { LookupTable } from './types';
import { EntityStatusEnum } from './types';

export function LookupTablesPage() {
    const modal = useModal();
    const t = useTranslations('toast.lookupTable');
    const { getList, setStatus, remove, isLoading, isUpdating, isDeleting } = useLookupTableApi();
    const [lookupTables, setLookupTables] = useState<LookupTable[]>([]);

    const refreshList = async () => {
        const response = await getList();
        if (response?.data?.items) {
            setLookupTables(response.data.items);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const handleToggleStatus = async (table: LookupTable) => {
        try {
            const nextStatus = table.status === EntityStatusEnum.ACTIVE ? EntityStatusEnum.BLOCKED : EntityStatusEnum.ACTIVE;
            const result = await setStatus(table.id, nextStatus);
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

    const handleDeleteTable = async (id: string) => {
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

    const createOrEditTable = async (editTable?: LookupTable) => {
        // TODO: Implement LookupTableModal
        toast.success('Feature coming soon');
        // const result = await modal.open((onClose) => (
        //     <LookupTableModal onClose={onClose} editData={editTable} />
        // ));
        // if (result) {
        //     await refreshList();
        // }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Lookup Tables</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage EMC and moisture content lookup tables</p>
                    </div>
                </div>
                <Button onClick={() => createOrEditTable()} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Lookup Table
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">All Lookup Tables</h2>
                    <p className="text-sm text-muted-foreground">
                        {lookupTables.length} lookup table{lookupTables.length !== 1 ? 's' : ''} configured
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {lookupTables.map((table) => (
                        <div key={table.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Table2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">{table.name}</h3>
                                        <p className="text-sm text-muted-foreground">Created {formatDate(table.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="hidden md:block">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            table.status === EntityStatusEnum.ACTIVE ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {table.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(table)}
                                            disabled={isUpdating}
                                        >
                                            {table.status === EntityStatusEnum.ACTIVE ? (
                                                <PowerOff className="w-4 h-4" />
                                            ) : (
                                                <Power className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => createOrEditTable(table)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTable(table.id)}
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

                {lookupTables.length === 0 && (
                    <div className="p-8 text-center">
                        <Table2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No lookup tables yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first lookup table</p>
                        <Button onClick={() => createOrEditTable()} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Lookup Table
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
