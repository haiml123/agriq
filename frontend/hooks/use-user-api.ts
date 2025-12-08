'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import { CreateUserDto, User, UserListParams, } from '@/schemas/user.schema';
import { PaginatedResponse } from '@/schemas/organization.schema';

export function useUserApi() {
    const { get, post, patch} = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const getList = useCallback(
        async (params?: UserListParams) => {
            setIsLoading(true);
            try {
                return await get<PaginatedResponse<User>>('/users', params);
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
                return await get<User>(`/users/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const create = useCallback(
        async (data: CreateUserDto) => {
            setIsCreating(true);
            try {
                return await post<User>('/users', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const update = useCallback(
        async (id: string, data: Partial<CreateUserDto>) => {
            setIsCreating(true);
            try {
                return await patch<User>(`/users/${id}`, data);
            } finally {
                setIsCreating(false);
            }
        },
        [patch]
    );

    return {
        getList,
        getById,
        create,
        update,
        isLoading,
        isCreating,
    };
}