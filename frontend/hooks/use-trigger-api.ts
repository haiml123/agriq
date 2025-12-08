'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import { Trigger, } from '@/schemas/trigger.schema';
import { PaginatedResponse } from '@/schemas/organization.schema';

export function useTriggerApi() {
    const { get, post, patch } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getList = useCallback(
        async (params?: any) => {
            setIsLoading(true);
            try {
                return await get<PaginatedResponse<Trigger>>('/triggers', params);
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
                return await get<Trigger>(`/triggers/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const create = useCallback(
        async (data: any) => {
            setIsCreating(true);
            try {
                return await post<Trigger>('/triggers', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const update = useCallback(
        async (id: string, data: any) => {
            setIsUpdating(true);
            try {
                return await patch<Trigger>(`/triggers/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const toggleActive = useCallback(
        async (id: string, isActive: boolean) => {
            setIsUpdating(true);
            try {
                return await patch<Trigger>(`/triggers/${id}`, { isActive });
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    // const remove = useCallback(
    //     async (id: string) => {
    //         setIsDeleting(true);
    //         try {
    //             return await del<void>(`/triggers/${id}`);
    //         } finally {
    //             setIsDeleting(false);
    //         }
    //     },
    //     [del]
    // );

    return {
        getList,
        getById,
        create,
        update,
        toggleActive,
        // remove,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    };
}
