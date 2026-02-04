'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import {
    CreateLookupTableDto,
    LookupTable,
    UpdateLookupTableDto,
} from '@/schemas/lookup-table.schema';
import type { CommodityType } from '@/schemas/commodity-type.schema';

type LookupTableListError = {
    error: string;
    status: number;
};

export function useLookupTableApi() {
    const { get, post, patch, del } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getByCommodityType = useCallback(
        async (commodityTypeId: string) => {
            setIsLoading(true);
            try {
                return await get<LookupTable>(`/commodity-types/${commodityTypeId}/lookup-table`);
            } finally {
                setIsLoading(false);
            }
        },
        [get],
    );

    const getList = useCallback(async () => {
        setIsLoading(true);
        try {
            const commodityTypesResponse = await get<CommodityType[]>('/commodity-types');
            if (!commodityTypesResponse.data) {
                return {
                    data: null,
                    error: commodityTypesResponse.error,
                    status: commodityTypesResponse.status,
                };
            }

            const results = await Promise.all(
                commodityTypesResponse.data.map(async (type) => {
                    const response = await get<LookupTable>(`/commodity-types/${type.id}/lookup-table`);
                    if (response.data) {
                        return response.data;
                    }
                    if (response.status === 404) {
                        return null;
                    }
                    return {
                        error: response.error ?? 'Failed to load lookup table',
                        status: response.status,
                    } satisfies LookupTableListError;
                }),
            );

            const items = results.filter((result): result is LookupTable => Boolean(result && 'id' in result));
            const errors = results.filter(
                (result): result is LookupTableListError => Boolean(result && 'error' in result),
            );

            if (errors.length > 0) {
                return {
                    data: { items },
                    error: errors[0].error,
                    status: errors[0].status,
                };
            }

            return { data: { items }, error: null, status: 200 };
        } finally {
            setIsLoading(false);
        }
    }, [get]);

    const create = useCallback(
        async (commodityTypeId: string, data: CreateLookupTableDto) => {
            setIsSaving(true);
            try {
                return await post<LookupTable>(`/commodity-types/${commodityTypeId}/lookup-table`, data);
            } finally {
                setIsSaving(false);
            }
        },
        [post],
    );

    const update = useCallback(
        async (commodityTypeId: string, data: UpdateLookupTableDto) => {
            setIsSaving(true);
            try {
                return await patch<LookupTable>(`/commodity-types/${commodityTypeId}/lookup-table`, data);
            } finally {
                setIsSaving(false);
            }
        },
        [patch],
    );

    const remove = useCallback(
        async (commodityTypeId: string) => {
            setIsSaving(true);
            try {
                return await del(`/commodity-types/${commodityTypeId}/lookup-table`);
            } finally {
                setIsSaving(false);
            }
        },
        [del],
    );

    return {
        getList,
        getByCommodityType,
        create,
        update,
        remove,
        isLoading,
        isSaving,
    };
}
