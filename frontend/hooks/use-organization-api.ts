'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import {
    ChangeStatusDto,
    CreateOrganizationDto,
    Organization,
    OrganizationListParams,
    PaginatedResponse,
    UpdateOrganizationDto
} from '@/schemas/organization.schema';

export function useOrganizationApi() {
    const { get, post, patch } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const getList = useCallback(
        async (params?: OrganizationListParams) => {
            setIsLoading(true);
            try {
                return await get<PaginatedResponse<Organization>>('/organizations', params);
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
                return await get<Organization>(`/organizations/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const create = useCallback(
        async (data: CreateOrganizationDto) => {
            setIsCreating(true);
            try {
                return await post<Organization>('/organizations', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const update = useCallback(
        async (id: string, data: UpdateOrganizationDto) => {
            setIsUpdating(true);
            try {
                return await patch<Organization>(`/organizations/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const changeStatus = useCallback(
        async (id: string, data: ChangeStatusDto) => {
            setIsUpdating(true);
            try {
                return await patch<Organization>(`/organizations/${id}/status`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    return {
        getList,
        getById,
        create,
        update,
        changeStatus,
        isLoading,
        isCreating,
        isUpdating,
    };
}