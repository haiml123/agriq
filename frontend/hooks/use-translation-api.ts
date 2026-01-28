'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import type {
    Translation,
    TranslationListParams,
    UpsertTranslationsDto,
} from '@/schemas/translation.schema';

export function useTranslationApi() {
    const { get, post } = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getList = useCallback(
        async (params: TranslationListParams) => {
            setIsLoading(true);
            try {
                const apiParams: Record<string, string> = {
                    entity: params.entity,
                    ...(params.field ? { field: params.field } : {}),
                    ...(params.locale ? { locale: params.locale } : {}),
                    ...(params.entityIds && params.entityIds.length > 0
                        ? { entityIds: params.entityIds.join(',') }
                        : {}),
                };
                return await get<Translation[]>('/translations', apiParams);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const upsertMany = useCallback(
        async (data: UpsertTranslationsDto) => {
            setIsSaving(true);
            try {
                return await post<Translation[]>('/translations/bulk', data);
            } finally {
                setIsSaving(false);
            }
        },
        [post]
    );

    return {
        getList,
        upsertMany,
        isLoading,
        isSaving,
    };
}
