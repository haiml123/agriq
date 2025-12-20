'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Pencil, Plus, Power, PowerOff, Trash2, Wheat } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { CommodityTypeModal } from '@/components/modals/commodity-type.modal';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { CommodityType } from '@/schemas/commodity-type.schema';
import { EntityStatus } from '@/schemas/common.schema';
import { formatDate } from '@/lib/utils';

export default function CommodityTypesPage() {
    const modal = useModal();
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
        const nextStatus: EntityStatus = type.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        await setStatus(type.id, nextStatus);
        await refreshList();
    };

    const handleDeleteCommodityType = async (id: string) => {
        await remove(id);
        await refreshList();
    };

    const openCommodityTypeModal = async (commodityType?: CommodityType) => {
        const result = await modal.open<CommodityType | null>((onClose) => (
            <CommodityTypeModal commodityType={commodityType} onClose={onClose} />
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
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage commodity types for your stored goods
                        </p>
                    </div>
                </div>
                <Button onClick={() => openCommodityTypeModal()} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Commodity Type
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <p className="text-sm text-muted-foreground">
                        {commodityTypes.length} commodity type{commodityTypes.length !== 1 ? 's' : ''} registered
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {commodityTypes.map((type) => (
                        <div key={type.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Wheat className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-foreground truncate">{type.name}</h3>
                                            {type.status !== 'ACTIVE' && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {type.status}
                                                </span>
                                            )}
                                        </div>
                                        {type.description ? (
                                            <p className="text-sm text-muted-foreground truncate">{type.description}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Created {formatDate(type.createdAt)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="hidden md:flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="w-4 h-4" />
                                            <span>0 commodities</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleStatus(type)}
                                            disabled={isUpdating}
                                            title={type.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                        >
                                            {type.status === 'ACTIVE' ? (
                                                <Power className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <PowerOff className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openCommodityTypeModal(type)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCommodityType(type.id)}
                                            className="text-destructive hover:text-destructive"
                                            disabled={isDeleting}
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
                        <Wheat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No commodity types yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get started by creating your first commodity type
                        </p>
                        <Button onClick={() => openCommodityTypeModal()} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Commodity Type
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
