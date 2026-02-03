'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import {
    CommodityType,
    CreateCommodityTypeDto,
    UpdateCommodityTypeDto,
} from '@/schemas/commodity-type.schema';
import { EntityStatus } from '@/schemas/common.schema';

export function useCommodityTypeApi() {
    const { get, post, patch, del } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getList = useCallback(
        async () => {
            setIsLoading(true);
            try {
                return await get<CommodityType[]>('/commodity-types');
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
                return await get<CommodityType>(`/commodity-types/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const create = useCallback(
        async (data: CreateCommodityTypeDto) => {
            setIsCreating(true);
            try {
                return await post<CommodityType>('/commodity-types', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const update = useCallback(
        async (id: string, data: UpdateCommodityTypeDto) => {
            setIsUpdating(true);
            try {
                return await patch<CommodityType>(`/commodity-types/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const setStatus = useCallback(
        async (id: string, status: EntityStatus) => {
            setIsUpdating(true);
            try {
                return await patch<CommodityType>(`/commodity-types/${id}`, { status });
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const remove = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del(`/commodity-types/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    return {
        getList,
        getById,
        create,
        update,
        setStatus,
        remove,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    };
}
