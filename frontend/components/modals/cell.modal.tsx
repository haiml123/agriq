'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Cell, CreateCellDto, UpdateCellDto, updateCellSchema } from '@/schemas/sites.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';


interface CellModalProps {
    compoundName: string;
    cell?: Cell | null;
    onClose: (result?: CreateCellDto | UpdateCellDto | null) => void;
}

export function CellModal({ compoundName, cell, onClose }: CellModalProps) {
    const t = useTranslations('modals.cell');
    const tCommon = useTranslations('common');
    const isEdit = !!cell?.id;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<UpdateCellDto>({
        resolver: zodResolver(updateCellSchema),
        defaultValues: {
            name:  cell?.name,
            capacity: cell?.capacity || 0,
        },
        mode: 'onChange',
    });


    const onSubmit = (data: UpdateCellDto) => {
        onClose(data);
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {isEdit ? t('editTitle') : t('createTitle', { compoundName })}
                </DialogTitle>
                <DialogDescription>
                    {isEdit ? t('editDescription') : t('createDescription')}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="cellName" className="text-sm font-medium text-foreground">
                        {t('cellName')}
                    </label>
                    <Input
                        id="cellName"
                        placeholder={t('cellNamePlaceholder')}
                        {...register('name')}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="capacity" className="text-sm font-medium text-foreground">
                        {t('capacity')}
                    </label>
                    <Input
                        id="capacity"
                        type="number"
                        min={0}
                        placeholder={t('capacityPlaceholder')}
                        {...register('capacity', { valueAsNumber: true })}
                    />
                    {errors.capacity && (
                        <p className="text-sm text-destructive">{errors.capacity.message}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onClose()}>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isValid}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        {isEdit ? t('saveButton') : t('createButton')}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}