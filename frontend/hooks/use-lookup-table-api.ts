'use client'

import { useCallback, useState } from 'react'
import { useApi } from './use-api'
import {
    CreateLookupTableDto,
    LookupTable,
    UpdateLookupTableDto,
} from '@/schemas/lookup-table.schema'

export function useLookupTableApi() {
    const { get, post, patch, del } = useApi()

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const getByCommodityType = useCallback(
        async (commodityTypeId: string) => {
            setIsLoading(true)
            try {
                return await get<LookupTable>(
                    `/commodity-types/${commodityTypeId}/lookup-table`
                )
            } finally {
                setIsLoading(false)
            }
        },
        [get]
    )

    const create = useCallback(
        async (commodityTypeId: string, data: CreateLookupTableDto) => {
            setIsSaving(true)
            try {
                return await post<LookupTable>(
                    `/commodity-types/${commodityTypeId}/lookup-table`,
                    data
                )
            } finally {
                setIsSaving(false)
            }
        },
        [post]
    )

    const update = useCallback(
        async (commodityTypeId: string, data: UpdateLookupTableDto) => {
            setIsSaving(true)
            try {
                return await patch<LookupTable>(
                    `/commodity-types/${commodityTypeId}/lookup-table`,
                    data
                )
            } finally {
                setIsSaving(false)
            }
        },
        [patch]
    )

    const remove = useCallback(
        async (commodityTypeId: string) => {
            setIsDeleting(true)
            try {
                return await del(
                    `/commodity-types/${commodityTypeId}/lookup-table`
                )
            } finally {
                setIsDeleting(false)
            }
        },
        [del]
    )

    return {
        getByCommodityType,
        create,
        update,
        remove,
        isLoading,
        isSaving,
        isDeleting,
    }
}
