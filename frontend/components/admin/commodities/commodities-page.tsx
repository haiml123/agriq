'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Pencil, Plus, Power, PowerOff, Trash2, Wheat } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { CommodityTypeModal } from '@/components/modals/commodity-type.modal';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { CommodityType, EntityStatus } from './types';
import { EntityStatusEnum } from './types';

export function CommoditiesPage() {
    const modal = useModal();
    const t = useTranslations('toast.commodityType');
    const { getList, setStatus, remove, isLoading, isUpdating, isDeleting } = useCommodityTypeApi();
    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);

    const refreshList = async () => {
        const response = await getList();
        if (response?.data?.items) {
            setCommodityTypes(response.data.items);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const handleToggleStatus = async (type: CommodityType) => {
        try {
            const nextStatus: EntityStatus = type.status === EntityStatusEnum.ACTIVE ? EntityStatusEnum.BLOCKED : EntityStatusEnum.ACTIVE;
            const result = await setStatus(type.id, nextStatus);
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

    const handleDeleteCommodityType = async (id: string) => {
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

    const createOrEditCommodityType = async (editType?: CommodityType) => {
        const result = await modal.open((onClose) => (
            <CommodityTypeModal onClose={onClose} commodityType={editType} />
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
                        <h1 className="text-2xl font-semibold text-foreground">Commodity Types</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage commodity types and categories</p>
                    </div>
                </div>
                <Button onClick={() => createOrEditCommodityType()} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Commodity Type
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">All Commodity Types</h2>
                    <p className="text-sm text-muted-foreground">
                        {commodityTypes.length} commodity type{commodityTypes.length !== 1 ? 's' : ''} registered
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {commodityTypes.map((type) => (
                        <div key={type.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Wheat className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">{type.name}</h3>
                                        <p className="text-sm text-muted-foreground">Created {formatDate(type.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="hidden md:block">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            type.status === EntityStatusEnum.ACTIVE ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {type.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(type)}
                                            disabled={isUpdating}
                                        >
                                            {type.status === EntityStatusEnum.ACTIVE ? (
                                                <PowerOff className="w-4 h-4" />
                                            ) : (
                                                <Power className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => createOrEditCommodityType(type)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCommodityType(type.id)}
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

                {commodityTypes.length === 0 && (
                    <div className="p-8 text-center">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No commodity types yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first commodity type</p>
                        <Button onClick={() => createOrEditCommodityType()} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Commodity Type
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
