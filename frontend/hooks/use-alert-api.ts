'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import type { ApiAlert } from '@/schemas/alert.schema';

export interface AlertListParams extends Record<string, string | number | boolean | undefined> {
    organizationId?: string;
    userId?: string;
    siteId?: string;
    compoundId?: string;
    status?: string;
    severity?: string;
    limit?: number;
}

export function useAlertApi() {
    const { get, patch } = useApi();

    const [isLoading, setIsLoading] = useState(false);

    const getList = useCallback(
        async (params?: AlertListParams) => {
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

    const acknowledge = useCallback(
        async (id: string) => {
            setIsLoading(true);
            try {
                return await patch<ApiAlert>(`/alerts/${id}/acknowledge`, {});
            } finally {
                setIsLoading(false);
            }
        },
        [patch]
    );

    const updateStatus = useCallback(
        async (id: string, status: string) => {
            setIsLoading(true);
            try {
                return await patch<ApiAlert>(`/alerts/${id}/status`, { status });
            } finally {
                setIsLoading(false);
            }
        },
        [patch]
    );

    return {
        getList,
        getById,
        acknowledge,
        updateStatus,
        isLoading,
    };
}
