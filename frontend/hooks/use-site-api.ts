'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import {
    Cell,
    Compound,
    CreateCellDto,
    CreateCompoundDto,
    CreateSiteDto,
    Site,
    SiteListParams,
    UpdateCellDto,
    UpdateCompoundDto,
    UpdateSiteDto,
} from '@/schemas/sites.schema';

export function useSiteApi() {
    const { get, post, patch, del } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ============ SITES ============

    const getSites = useCallback(
        async (params?: SiteListParams) => {
            setIsLoading(true);
            try {
                return await get<Site[]>('/sites', params);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const getSiteById = useCallback(
        async (id: string) => {
            setIsLoading(true);
            try {
                return await get<Site>(`/sites/${id}`);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const createSite = useCallback(
        async (data: CreateSiteDto) => {
            setIsCreating(true);
            try {
                return await post<Site>('/sites', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const updateSite = useCallback(
        async (id: string, data: UpdateSiteDto) => {
            setIsUpdating(true);
            try {
                return await patch<Site>(`/sites/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const deleteSite = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del(`/sites/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    const createCompound = useCallback(
        async (data: CreateCompoundDto) => {
            setIsCreating(true);
            try {
                return await post<Compound>('/sites/compounds', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const updateCompound = useCallback(
        async (id: string, data: UpdateCompoundDto) => {
            setIsUpdating(true);
            try {
                return await patch<Compound>(`/sites/compounds/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const deleteCompound = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del(`/sites/compounds/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    // ============ CELLS ============

    const createCell = useCallback(
        async (data: CreateCellDto) => {
            setIsCreating(true);
            try {
                return await post<Cell>('/sites/cells', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const updateCell = useCallback(
        async (id: string, data: UpdateCellDto) => {
            setIsUpdating(true);
            try {
                return await patch<Cell>(`/sites/cells/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const deleteCell = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del(`/sites/cells/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    return {
        // Sites
        getSites,
        getSiteById,
        createSite,
        updateSite,
        deleteSite,

        // Compounds
        createCompound,
        updateCompound,
        deleteCompound,

        // Cells
        createCell,
        updateCell,
        deleteCell,

        // Loading states
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    };
}
