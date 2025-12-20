'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import type { ApiTrade } from '@/schemas/trade.schema';

export function useTradeApi() {
    const { get } = useApi();

    const [isLoading, setIsLoading] = useState(false);

    const getRecent = useCallback(
        async (params?: { organizationId?: string; limit?: number }) => {
            setIsLoading(true);
            try {
                return await get<ApiTrade[]>('/trades/recent', params);
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
                return await get<ApiTrade>(`/trades/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    return {
        getRecent,
        getById,
        isLoading,
    };
}
