import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { CommodityType, CreateCommodityTypeDto, UpdateCommodityTypeDto } from '@/schemas/commodity-type.schema';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CommodityTypeModalProps {
    commodityType?: CommodityType;
    onClose: (result?: CommodityType | null) => void;
}

export function CommodityTypeModal({ commodityType, onClose }: CommodityTypeModalProps) {
    const t = useTranslations('toast.commodityType');
    const { create, update, isCreating, isUpdating } = useCommodityTypeApi();

    const [formData, setFormData] = useState({
        name: commodityType?.name || '',
        description: commodityType?.description || '',
    });

    const isEditing = !!commodityType;
    const isLoading = isCreating || isUpdating;

    const handleSubmit = async () => {
        if (isEditing) {
            const updateData: UpdateCommodityTypeDto = {
                name: formData.name,
                description: formData.description.trim() || undefined,
            };
            const response = await update(commodityType.id, updateData);
            if (response?.data) {
                toast.success(t('updateSuccess'));
                onClose(response.data);
            } else {
                toast.error(response?.error || t('updateError'));
            }
        } else {
            const createData: CreateCommodityTypeDto = {
                name: formData.name,
                description: formData.description.trim() || undefined,
            };
            const response = await create(createData);
            if (response?.data) {
                toast.success(t('createSuccess'));
                onClose(response.data);
            } else {
                toast.error(response?.error || t('createError'));
            }
        }
    };

    const isValid = formData.name.trim().length >= 2;

    return (
        <>
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Commodity Type' : 'Create New Commodity Type'}</DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? 'Update the commodity type details.'
                        : 'Add a new commodity type to categorize your stored commodities. Examples: Wheat, Corn, Barley, etc.'}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="typeName" className="text-sm font-medium text-foreground">
                        Type Name
                    </label>
                    <Input
                        id="typeName"
                        placeholder="e.g., Wheat, Corn, Soybeans"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="typeDescription" className="text-sm font-medium text-foreground">
                        Description <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Textarea
                        id="typeDescription"
                        placeholder="Brief description of this commodity type..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onClose()}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {isLoading
                        ? isEditing
                            ? 'Saving...'
                            : 'Creating...'
                        : isEditing
                            ? 'Save Changes'
                            : 'Create Commodity Type'}
                </Button>
            </DialogFooter>
        </>
    );
}