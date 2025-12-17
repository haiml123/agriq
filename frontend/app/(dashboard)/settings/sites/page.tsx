'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout'
import { useModal } from '@/components/providers/modal-provider'
import {
    Cell,
    CreateCellDto,
    CreateCompoundDto,
    CreateSiteDto,
    Site,
    UpdateCellDto,
    UpdateCompoundDto,
    UpdateSiteDto,
} from '@/schemas/sites.schema'
import { useCurrentUser } from '@/hooks'
import { useSiteApi } from '@/hooks/use-site-api'
import { OrganizationSelect } from '@/components/select/organization-select'
import { SitesList } from '@/components/sites-table/sites-list'
import { Button } from '@/components/ui/button'
import { SiteModal } from '@/components/modals/site.modal'

export default function SitesPage() {
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

    const [sites, setSites] = useState<Site[]>([])
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all')
    const canCreateSite = isSuperAdmin || isAdmin
    const headingTitle = canCreateSite ? 'All Sites' : 'My Sites'

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

    const openCreateSiteModal = async () => {
        if (!canCreateSite) return
        const result = await modal.open<{ name: string; address?: string } | null>((onClose) => (
            <SiteModal onClose={onClose} />
        ))
        if (result) {
            await handleCreateSite(result)
        }
    }

    // Site handlers
    const handleCreateSite = async (data: CreateSiteDto) => {
        const organizationId = isSuperAdmin && selectedOrganizationId !== 'all'
            ? selectedOrganizationId
            : user?.organizationId

        if (!organizationId) {
            console.error('No organization ID available')
            return
        }

        try {
            const dto: CreateSiteDto = {
                name: data.name,
                address: data.address ?? undefined,
                organizationId,
            }
            const newSite = await createSite(dto)
            if (newSite) {
                setSites(prev => [...prev, newSite.data as Site])
            }
        } catch (error) {
            console.error('Failed to create site:', error)
        }
    }

    const handleEditSite = async (siteId: string, data: UpdateSiteDto) => {
        try {
            const dto: UpdateSiteDto = {
                name: data.name,
                address: data.address ?? undefined,
            }
            const updated = await updateSite(siteId, dto)
            if (updated) {
                setSites(prev => prev.map(site =>
                    site.id === siteId ? { ...site, ...data } : site
                ))
            }
        } catch (error) {
            console.error('Failed to update site:', error)
        }
    }

    const handleDeleteSite = async (siteId: string) => {
        try {
            await deleteSite(siteId)
            setSites(prev => prev.filter(site => site.id !== siteId))
        } catch (error) {
            console.error('Failed to delete site:', error)
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
            if (newCompound) {
                setSites(prev => prev.map(site =>
                    site.id === siteId
                        ? { ...site, compounds: [...(site.compounds || []), newCompound.data as any] }
                        : site
                ))
            }
        } catch (error) {
            console.error('Failed to create compound:', error)
        }
    }

    const handleEditCompound = async (compoundId: string, data: UpdateCompoundDto) => {
        try {
            const dto: UpdateCompoundDto = {
                name: data.name,
            }
            const updated = await updateCompound(compoundId, dto)
            if (updated) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound =>
                        compound.id === compoundId ? { ...compound, ...data } : compound
                    )
                })))
            }
        } catch (error) {
            console.error('Failed to update compound:', error)
        }
    }

    const handleDeleteCompound = async (compoundId: string) => {
        try {
            await deleteCompound(compoundId)
            setSites(prev => prev.map(site => ({
                ...site,
                compounds: site.compounds?.filter(compound => compound.id !== compoundId)
            })))
        } catch (error) {
            console.error('Failed to delete compound:', error)
        }
    }

    // Cell handlers
    const handleCreateCell = async (compoundId: string, data: Pick<Cell, 'name' | 'capacity'>) => {
        try {
            const dto: CreateCellDto = {
                name: data.name,
                capacity: data.capacity ?? 0,
                compoundId,
            }
            const newCell = await createCell(dto)
            if (newCell) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound =>
                        compound.id === compoundId
                            ? { ...compound, cells: [...(compound.cells || []), newCell.data as any] }
                            : compound
                    )
                })))
            }
        } catch (error) {
            console.error('Failed to create cell:', error)
        }
    }

    const handleEditCell = async (cellId: string, data: UpdateCellDto) => {
        try {
            const dto: UpdateCellDto = {
                name: data.name,
                capacity: data.capacity,
            }
            const updated = await updateCell(cellId, dto)
            if (updated) {
                setSites(prev => prev.map(site => ({
                    ...site,
                    compounds: site.compounds?.map(compound => ({
                        ...compound,
                        cells: compound.cells?.map(cell =>
                            cell.id === cellId ? { ...cell, ...data } : cell
                        )
                    }))
                })))
            }
        } catch (error) {
            console.error('Failed to update cell:', error)
        }
    }

    const handleDeleteCell = async (cellId: string) => {
        try {
            await deleteCell(cellId)
            setSites(prev => prev.map(site => ({
                ...site,
                compounds: site.compounds?.map(compound => ({
                    ...compound,
                    cells: compound.cells?.filter(cell => cell.id !== cellId)
                }))
            })))
        } catch (error) {
            console.error('Failed to delete cell:', error)
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
                            {canCreateSite ? 'Manage sites, compounds, and cells' : 'View your assigned sites'}
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
                        Add Site
                    </Button>
                )}
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {sites.length} site{sites.length !== 1 ? 's' : ''} • {totalCompounds} compound{totalCompounds !== 1 ? 's' : ''} • {totalCells} cell{totalCells !== 1 ? 's' : ''}
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
                        <p className="text-sm text-muted-foreground">Loading sites...</p>
                    </div>
                ) : sites.length > 0 ? (
                    <SitesList
                        sites={sites}
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
                        <h3 className="font-medium text-foreground mb-1">No sites yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {canCreateSite
                                ? 'Get started by creating your first site'
                                : 'You have not been assigned to any sites yet'}
                        </p>
                        {canCreateSite && (
                            <Button
                                onClick={openCreateSiteModal}
                                disabled={isProcessing}
                                className="bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Site
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
