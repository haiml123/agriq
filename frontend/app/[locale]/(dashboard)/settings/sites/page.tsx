'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout'
import { useModal } from '@/components/providers/modal-provider'
import {
    Cell,
    CreateCellDto,
    CreateCompoundDto,
    Gateway,
    CreateSiteDto,
    Site,
    UpdateCellDto,
    UpdateCompoundDto,
    UpdateSiteDto,
} from '@/schemas/sites.schema'
import { useCurrentUser } from '@/hooks'
import { useSiteApi } from '@/hooks/use-site-api'
import { useGatewayApi } from '@/hooks/use-gateway-api'
import { OrganizationSelect } from '@/components/select/organization-select'
import { SitesList } from '@/components/sites-table/sites-list'
import { Button } from '@/components/ui/button'
import { SiteModal } from '@/components/modals/site.modal'
import type { CellModalResult } from '@/components/modals/cell.modal'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export default function SitesPage() {
    const t = useTranslations('pages.settingsSites')
    const tToastSite = useTranslations('toast.site')
    const tToastCompound = useTranslations('toast.compound')
    const tToastCell = useTranslations('toast.cell')
    const modal = useModal()
    const { user, isSuperAdmin, isAdmin, isLoading: isCurrentUserLoading } = useCurrentUser()
    const {
        getSites,
        createSite,
        updateSite,
        deleteSite,
        createCompound,
        updateCompound,
        deleteCompound,
        createCell,
        updateCell,
        deleteCell,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    } = useSiteApi()
    const {
        getGateways,
        assignGatewayToCell,
        unpairGateway,
    } = useGatewayApi()

    const [sites, setSites] = useState<Site[]>([])
    const [availableGateways, setAvailableGateways] = useState<Gateway[]>([])
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all')
    const canCreateSite = isSuperAdmin || isAdmin
    const headingTitle = canCreateSite ? t('allSites') : t('mySites')

    const fetchSites = useCallback(async () => {
        if (isCurrentUserLoading || !user) return

        try {
            const params = isSuperAdmin && selectedOrganizationId !== 'all'
                ? { organizationId: selectedOrganizationId }
                : undefined
            const response = await getSites(params)
            if (response) {
                setSites(response.data as Site[])
            }
        } catch (error) {
            console.error('Failed to fetch sites:', error)
        }
    }, [getSites, isCurrentUserLoading, isSuperAdmin, selectedOrganizationId, user])

    useEffect(() => {
        fetchSites()
    }, [fetchSites])

    const fetchAvailableGateways = useCallback(async () => {
        if (isCurrentUserLoading || !user) return

        const organizationId =
            isSuperAdmin && selectedOrganizationId !== 'all'
                ? selectedOrganizationId
                : user.organizationId

        if (!organizationId) {
            setAvailableGateways([])
            return
        }

        const response = await getGateways({ organizationId, unpaired: true })
        if (response?.data) {
            setAvailableGateways(response.data as Gateway[])
        }
    }, [getGateways, isCurrentUserLoading, isSuperAdmin, selectedOrganizationId, user])

    useEffect(() => {
        fetchAvailableGateways()
    }, [fetchAvailableGateways])

    const openCreateSiteModal = async () => {
        if (!canCreateSite) return
        const result = await modal.open<UpdateSiteDto | null>((onClose) => (
            <SiteModal onClose={onClose} />
        ))
        if (result) {
            await handleCreateSite(result as CreateSiteDto)
        }
    }

    // Site handlers
    const handleCreateSite = async (data: CreateSiteDto) => {
        const organizationId = isSuperAdmin && selectedOrganizationId !== 'all'
            ? selectedOrganizationId
            : user?.organizationId

        if (!organizationId) {
            console.error('No organization ID available')
            toast.error(tToastSite('createError'))
            return
        }

        try {
            const dto: CreateSiteDto = {
                name: data.name,
                address: data.address ?? undefined,
                organizationId,
            }
            const newSite = await createSite(dto)
            if (newSite?.data) {
                setSites(prev => [...prev, newSite.data as Site])
                toast.success(tToastSite('createSuccess'))
            } else {
                toast.error(newSite?.error || tToastSite('createError'))
            }
        } catch (error) {
            console.error('Failed to create site:', error)
            toast.error(tToastSite('createError'))
        }
    }

    const handleEditSite = async (siteId: string, data: UpdateSiteDto) => {
        try {
            const dto: UpdateSiteDto = {
                name: data.name,
                address: data.address ?? undefined,
            }
            const updated = await updateSite(siteId, dto)
            if (updated?.data) {
                setSites(prev => prev.map(site =>
                    site.id === siteId ? { ...site, ...data } : site
                ))
                toast.success(tToastSite('updateSuccess'))
            } else {
                toast.error(updated?.error || tToastSite('updateError'))
            }
        } catch (error) {
            console.error('Failed to update site:', error)
            toast.error(tToastSite('updateError'))
        }
    }

    const handleDeleteSite = async (siteId: string) => {
        try {
            const result = await deleteSite(siteId)
            if (result?.data !== undefined) {
                setSites(prev => prev.filter(site => site.id !== siteId))
                toast.success(tToastSite('deleteSuccess'))
            } else {
                toast.error(result?.error || tToastSite('deleteError'))
            }
        } catch (error) {
            console.error('Failed to delete site:', error)
            toast.error(tToastSite('deleteError'))
        }
    }

    // Compound handlers
    const handleCreateCompound = async (siteId: string, data: CreateCompoundDto) => {
        try {
            const dto: CreateCompoundDto = {
                name: data.name,
                siteId,
            }
            const newCompound = await createCompound(dto)
            if (newCompound?.data) {
                setSites(prev => prev.map(site =>
                    site.id === siteId
                        ? { ...site, compounds: [...(site.compounds || []), newCompound.data as any] }
                        : site
                ))
                toast.success(tToastCompound('createSuccess'))
            } else {
                toast.error(newCompound?.error || tToastCompound('createError'))
            }
        } catch (error) {
            console.error('Failed to create compound:', error)
            toast.error(tToastCompound('createError'))
        }
    }

    const handleEditCompound = async (compoundId: string, data: UpdateCompoundDto) => {
        try {
            const dto: UpdateCompoundDto = {
                name: data.name,
            }
            const updated = await updateCompound(compoundId, dto)
            if (updated?.data) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound =>
                        compound.id === compoundId ? { ...compound, ...data } : compound
                    )
                })))
                toast.success(tToastCompound('updateSuccess'))
            } else {
                toast.error(updated?.error || tToastCompound('updateError'))
            }
        } catch (error) {
            console.error('Failed to update compound:', error)
            toast.error(tToastCompound('updateError'))
        }
    }

    const handleDeleteCompound = async (compoundId: string) => {
        try {
            const result = await deleteCompound(compoundId)
            if (result?.data !== undefined) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.filter(compound => compound.id !== compoundId)
                })))
                toast.success(tToastCompound('deleteSuccess'))
            } else {
                toast.error(result?.error || tToastCompound('deleteError'))
            }
        } catch (error) {
            console.error('Failed to delete compound:', error)
            toast.error(tToastCompound('deleteError'))
        }
    }

    // Cell handlers
    const handleCreateCell = async (compoundId: string, data: CellModalResult) => {
        try {
            const dto: CreateCellDto = {
                name: data.name,
                height: data.height ?? 0,
                length: data.length ?? 0,
                width: data.width ?? 0,
                compoundId,
            }
            const newCell = await createCell(dto)
            if (newCell?.data) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound =>
                        compound.id === compoundId
                            ? { ...compound, cells: [...(compound.cells || []), newCell.data as any] }
                            : compound
                    )
                })))
                if (data.gatewayId) {
                    const assignResult = await assignGatewayToCell(data.gatewayId, {
                        cellId: (newCell.data as Cell).id,
                    })
                    if (assignResult?.error) {
                        toast.error(assignResult.error)
                    }
                    await fetchSites()
                    await fetchAvailableGateways()
                }
                toast.success(tToastCell('createSuccess'))
            } else {
                toast.error(newCell?.error || tToastCell('createError'))
            }
        } catch (error) {
            console.error('Failed to create cell:', error)
            toast.error(tToastCell('createError'))
        }
    }

    const handleEditCell = async (cellId: string, data: CellModalResult) => {
        try {
            const dto: UpdateCellDto = {
                name: data.name,
                height: data.height,
                length: data.length,
                width: data.width,
            }
            const updated = await updateCell(cellId, dto)
            if (updated?.data) {
                const currentCell = sites
                    .flatMap(site => site.compounds || [])
                    .flatMap(compound => compound.cells || [])
                    .find(cell => cell.id === cellId)
                const currentGatewayId = currentCell?.gateways?.[0]?.id

                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound => ({
                        ...compound,
                        cells: compound.cells?.map(cell =>
                            cell.id === cellId ? { ...cell, ...data } : cell
                        )
                    }))
                })))
                if (data.gatewayId && data.gatewayId !== currentGatewayId) {
                    const assignResult = await assignGatewayToCell(data.gatewayId, { cellId })
                    if (assignResult?.error) {
                        toast.error(assignResult.error)
                    }
                    await fetchSites()
                    await fetchAvailableGateways()
                }
                if (!data.gatewayId && currentGatewayId) {
                    const unpairResult = await unpairGateway(currentGatewayId)
                    if (unpairResult?.error) {
                        toast.error(unpairResult.error)
                    }
                    await fetchSites()
                    await fetchAvailableGateways()
                }
                toast.success(tToastCell('updateSuccess'))
            } else {
                toast.error(updated?.error || tToastCell('updateError'))
            }
        } catch (error) {
            console.error('Failed to update cell:', error)
            toast.error(tToastCell('updateError'))
        }
    }

    const handleDeleteCell = async (cellId: string) => {
        try {
            const result = await deleteCell(cellId)
            if (result?.data !== undefined) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound => ({
                        ...compound,
                        cells: compound.cells?.filter(cell => cell.id !== cellId)
                    }))
                })))
                toast.success(tToastCell('deleteSuccess'))
            } else {
                toast.error(result?.error || tToastCell('deleteError'))
            }
        } catch (error) {
            console.error('Failed to delete cell:', error)
            toast.error(tToastCell('deleteError'))
        }
    }

    console.log('sites', sites);
    const totalCompounds = sites?.reduce((acc, s) => acc + (s.compounds?.length ?? 0), 0)
    const totalCells = sites?.reduce(
        (acc, s) => acc + (s.compounds?.reduce((a, c) => a + (c.cells?.length ?? 0), 0) ?? 0),
        0
    )

    const isProcessing = isCreating || isUpdating || isDeleting

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{headingTitle}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {canCreateSite ? t('manageSites') : t('viewSites')}
                        </p>
                    </div>
                </div>
                {canCreateSite && (
                    <Button
                        onClick={openCreateSiteModal}
                        disabled={isProcessing}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addSite')}
                    </Button>
                )}
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {t('sitesCount', { sites: sites?.length, compounds: totalCompounds, cells: totalCells })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isSuperAdmin && (
                            <OrganizationSelect
                                value={selectedOrganizationId}
                                onChange={setSelectedOrganizationId}
                                className="w-full md:w-64"
                            />
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">{t('loadingSites')}</p>
                    </div>
                ) : sites?.length > 0 ? (
                    <SitesList
                        sites={sites}
                        availableGateways={availableGateways}
                        onEditSite={handleEditSite}
                        onDeleteSite={handleDeleteSite}
                        onCreateCompound={handleCreateCompound}
                        onEditCompound={handleEditCompound}
                        onDeleteCompound={handleDeleteCompound}
                        onCreateCell={handleCreateCell}
                        onEditCell={handleEditCell}
                        onDeleteCell={handleDeleteCell}
                    />
                ) : (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">{t('noSites')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {canCreateSite
                                ? t('getStartedAdmin')
                                : t('getStartedUser')}
                        </p>
                        {canCreateSite && (
                            <Button
                                onClick={openCreateSiteModal}
                                disabled={isProcessing}
                                className="bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('addSite')}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
