'use client';

import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

type EmptyCommodityTypesProps = {
    onCreate: () => void;
};

export function EmptyCommodityTypes({ onCreate }: EmptyCommodityTypesProps) {
    return (
        <div className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No commodity types yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by creating your first commodity type</p>
            <Button onClick={onCreate} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Commodity Type
            </Button>
        </div>
    );
}
