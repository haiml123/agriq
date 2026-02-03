'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Pencil, Power, PowerOff, Trash2, Wheat } from 'lucide-react';
import type { CommodityType } from './types';
import { EntityStatusEnum } from './types';

type CommodityTypeRowProps = {
    type: CommodityType;
    isUpdating: boolean;
    isDeleting: boolean;
    onToggleStatus: (type: CommodityType) => void;
    onEdit: (type: CommodityType) => void;
    onDelete: (id: string) => void;
};

export function CommodityTypeRow({
    type,
    isUpdating,
    isDeleting,
    onToggleStatus,
    onEdit,
    onDelete,
}: CommodityTypeRowProps) {
    return (
        <div className="p-4 hover:bg-muted/30 transition-colors">
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
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                type.status === EntityStatusEnum.ACTIVE
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-500'
                            }`}
                        >
                            {type.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleStatus(type)}
                            disabled={isUpdating}
                        >
                            {type.status === EntityStatusEnum.ACTIVE ? (
                                <PowerOff className="w-4 h-4" />
                            ) : (
                                <Power className="w-4 h-4" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(type)}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(type.id)}
                            disabled={isDeleting}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
