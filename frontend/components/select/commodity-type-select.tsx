'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';
import type { CommodityType } from '@/schemas/commodity-type.schema';
import { useLocale } from 'next-intl';
import { useTranslationMap } from '@/hooks/use-translation-map';

type CommodityTypeOption = Pick<CommodityType, 'id' | 'name'> & {
    status?: CommodityType['status'];
};

interface CommodityTypeSelectProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    triggerClassName?: string;
    placeholder?: string;
    includeAll?: boolean;
    allLabel?: string;
    emptyLabel?: string;
    loadingLabel?: string;
    disabled?: boolean;
    commodityTypes?: CommodityTypeOption[];
    isLoading?: boolean;
    getLabel?: (type: CommodityTypeOption) => string;
    renderItem?: (payload: { type: CommodityTypeOption; label: string }) => React.ReactNode;
}

export function CommodityTypeSelect({
    value,
    onChange,
    className,
    triggerClassName,
    placeholder = 'Select commodity type',
    includeAll = false,
    allLabel = 'All commodity types',
    emptyLabel = 'No commodity types available',
    loadingLabel = 'Loading commodity types...',
    disabled,
    commodityTypes,
    isLoading,
    getLabel,
    renderItem,
}: CommodityTypeSelectProps) {
    const locale = useLocale();
    const resolveCommodityTypeName = useTranslationMap('commodity_type', locale);
    const { getList: getCommodityTypes } = useCommodityTypeApi();
    const [internalCommodityTypes, setInternalCommodityTypes] = useState<CommodityTypeOption[]>([]);
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    useEffect(() => {
        if (commodityTypes) {
            return;
        }

        let isActive = true;
        setIsInternalLoading(true);
        getCommodityTypes()
            .then((response) => {
                if (!isActive) return;
                if (response?.data && Array.isArray(response.data)) {
                    setInternalCommodityTypes(response.data);
                } else {
                    setInternalCommodityTypes([]);
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsInternalLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [commodityTypes, getCommodityTypes]);

    const types = commodityTypes ?? internalCommodityTypes;
    const loading = isLoading ?? isInternalLoading;
    const isEmpty = !loading && types.length === 0;

    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className={triggerClassName ?? 'w-full'}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
                    {loading && (
                        <SelectItem value="loading" disabled>
                            {loadingLabel}
                        </SelectItem>
                    )}
                    {isEmpty && (
                        <SelectItem value="no-types" disabled>
                            {emptyLabel}
                        </SelectItem>
                    )}
                    {types.map((type) => {
                        const label = getLabel
                            ? getLabel(type)
                            : resolveCommodityTypeName(type.id, 'name', type.name);
                        return (
                            <SelectItem key={type.id} value={type.id}>
                                {renderItem ? renderItem({ type, label }) : label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
