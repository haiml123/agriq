'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import { CreateUserDto, User, UserListParams, } from '@/schemas/user.schema';
import { PaginatedResponse } from '@/schemas/organization.schema';

export function useUserApi() {
    const { get, post } = useApi();

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

    return {
        getList,
        getById,
        create,
        isLoading,
        isCreating,
    };
}