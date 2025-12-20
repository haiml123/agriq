'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import type { ApiAlert } from '@/schemas/alert.schema';

export function useAlertApi() {
    const { get } = useApi();

    const [isLoading, setIsLoading] = useState(false);

    const getList = useCallback(
        async (params?: { organizationId?: string; limit?: number }) => {
            setIsLoading(true);
            try {
                return await get<ApiAlert[]>('/alerts', params);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const getById = useCallback(
        async (id: string) => {
            setIsLoading(true);
            try {
                return await get<ApiAlert>(`/alerts/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    return {
        getList,
        getById,
        isLoading,
    };
}
