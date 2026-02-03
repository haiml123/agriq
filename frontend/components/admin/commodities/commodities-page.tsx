'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { CommodityTypeModal } from '@/components/modals/commodity-type.modal';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { CommodityType, EntityStatus } from './types';
import { EntityStatusEnum } from './types';
import { CommodityTypeRow } from './commodity-type-row';
import { EmptyCommodityTypes } from './empty-commodity-types';

export function CommoditiesPage() {
    const modal = useModal();
    const t = useTranslations('toast.commodityType');
    const { getList, setStatus, remove, isUpdating, isDeleting } = useCommodityTypeApi();
    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);

    const refreshList = async () => {
        const response = await getList();
        setCommodityTypes(response?.data ?? []);
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
                        <CommodityTypeRow
                            key={type.id}
                            type={type}
                            isDeleting={isDeleting}
                            isUpdating={isUpdating}
                            onDelete={handleDeleteCommodityType}
                            onEdit={createOrEditCommodityType}
                            onToggleStatus={handleToggleStatus}
                        />
                    ))}
                </div>

                {commodityTypes.length === 0 && (
                    <EmptyCommodityTypes onCreate={createOrEditCommodityType} />
                )}
            </div>
        </div>
    );
}
