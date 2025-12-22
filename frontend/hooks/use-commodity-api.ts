'use client';

import { useCallback } from 'react';
import { useApi } from './use-api';
import type { Commodity, CreateCommodityDto, UpdateCommodityDto } from '@/schemas/commodity.schema';

export function useCommodityApi() {
    const { get, post, patch, del } = useApi();

    const getList = useCallback(
        (params?: { organizationId?: string; commodityTypeId?: string }) =>
            get<Commodity[]>('/commodities', params),
        [get]
    );

    const getById = useCallback(
        (id: string) => get<Commodity>(`/commodities/${id}`),
        [get]
    );

    const create = useCallback(
        (data: CreateCommodityDto) => post<Commodity>('/commodities', data),
        [post]
    );

    const update = useCallback(
        (id: string, data: UpdateCommodityDto) => patch<Commodity>(`/commodities/${id}`, data),
        [patch]
    );

    const remove = useCallback(
        (id: string) => del(`/commodities/${id}`),
        [del]
    );

    return { getList, getById, create, update, remove };
}
