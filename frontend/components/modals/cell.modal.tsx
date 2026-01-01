'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Cell, CreateCellDto, Gateway, UpdateCellDto, updateCellSchema } from '@/schemas/sites.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useModal } from '@/components/providers/modal-provider';
import { ConfirmActionModal } from '@/components/modals';


interface CellModalProps {
    compoundName: string;
    cell?: Cell | null;
    availableGateways?: Gateway[];
    onClose: (result?: CellModalResult | null) => void;
}

export type CellModalResult = (CreateCellDto | UpdateCellDto) & {
    gatewayId?: string | null;
};

export function CellModal({ compoundName, cell, availableGateways, onClose }: CellModalProps) {
    const t = useTranslations('modals.cell');
    const tCommon = useTranslations('common');
    const isEdit = !!cell?.id;
    const modal = useModal();
    const pairedGateway = useMemo(() => cell?.gateways?.[0], [cell?.gateways]);
    const noGatewayValue = '__no_gateway__';
    const [selectedGatewayId, setSelectedGatewayId] = useState(
        pairedGateway?.id ?? noGatewayValue
    );
    const [hasUnpaired, setHasUnpaired] = useState(false);
    const [gatewayError, setGatewayError] = useState('');
    const gatewayOptions = useMemo(() => {
        const base = availableGateways ?? [];
        if (pairedGateway && !base.some((gateway) => gateway.id === pairedGateway.id)) {
            return [pairedGateway, ...base];
        }
        return base;
    }, [availableGateways, pairedGateway]);

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
        onClose({
            ...data,
            gatewayId: selectedGatewayId === noGatewayValue ? null : selectedGatewayId,
        });
    };

    const handleGatewayChange = (value: string) => {
        setSelectedGatewayId(value);
        setGatewayError('');
    };

    const handleUnpair = async () => {
        const confirmed = await modal.open<boolean>((onClose) => (
            <ConfirmActionModal
                title={t('unpairTitle')}
                description={t('unpairDescription')}
                confirmLabel={t('unpairConfirm')}
                cancelLabel={tCommon('cancel')}
                onClose={onClose}
            />
        ));

        if (confirmed) {
            setSelectedGatewayId(noGatewayValue);
            setHasUnpaired(true);
            setGatewayError('');
        }
    };

    const isGatewaySelectDisabled = isEdit && !!pairedGateway && !hasUnpaired;

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
                <div className="space-y-2">
                    <label htmlFor="gatewayId" className="text-sm font-medium text-foreground">
                        {t('gatewaySelectLabel')}
                    </label>
                    <Select
                        value={selectedGatewayId}
                        onValueChange={handleGatewayChange}
                        disabled={isGatewaySelectDisabled}
                    >
                        <SelectTrigger id="gatewayId" className="w-full">
                            <SelectValue placeholder={t('gatewaySelectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={noGatewayValue}>{t('gatewaySelectNone')}</SelectItem>
                            {gatewayOptions.map((gateway) => (
                                <SelectItem key={gateway.id} value={gateway.id}>
                                    {gateway.externalId}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {gatewayError && (
                        <p className="text-sm text-destructive">{gatewayError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{t('gatewaySelectHelp')}</p>
                    {isEdit && pairedGateway && !hasUnpaired && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full text-destructive"
                            onClick={handleUnpair}
                        >
                            {t('unpairButton')}
                        </Button>
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
