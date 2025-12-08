'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout'
import { useModal } from '@/components/providers/modal-provider'
import { Cell, Site } from '@/schemas/sites.schema'
import { useCurrentUser } from '@/hooks'
import { OrganizationSelect } from '@/components/select/organization-select'
import { SitesList } from '@/components/sites-table/sites-list'
import { testSites } from '@/app/(dashboard)/settings/sites/site-example'
import { Button } from '@/components/ui/button'
import { SiteModal } from '@/components/modals/site.modal'

export default function SitesPage() {
    const modal = useModal()
    const { user, isSuperAdmin, isLoading: isCurrentUserLoading } = useCurrentUser()
    const {
        getList,
        create: createSite,
        update: updateSite,
        remove: deleteSite,
        createCompound,
        updateCompound,
        deleteCompound,
        createCell,
        updateCell,
        deleteCell,
        isLoading,
        isCreating,
    }: any = {}

    const [sites, setSites] = useState<Site[]>(testSites)
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all')

    const fetchSites = useCallback(async () => {
        if (isCurrentUserLoading || !user) return

        try {
            const response = await getList({
                organizationId: isSuperAdmin && selectedOrganizationId !== 'all' ? selectedOrganizationId : undefined,
            })
            if (response?.data?.items) {
                setSites(response.data.items)
            }
        } catch (error) {
            console.error('Failed to fetch sites:', error)
        }
    }, [getList, isCurrentUserLoading, isSuperAdmin, selectedOrganizationId, user])

    useEffect(() => {
        // fetchSites()
    }, [fetchSites])

    // Open create site modal
    const openCreateSiteModal = async () => {
        const result = await modal.open<{ name: string; address?: string } | null>((onClose) => (
            <SiteModal onClose={onClose} />
        ))
        if (result) {
            await handleCreateSite(result)
        }
    }

    // Site handlers
    const handleCreateSite = async (data: Pick<Site, 'name' | 'address'>) => {
        try {
            await createSite({
                ...data,
                organizationId: isSuperAdmin && selectedOrganizationId !== 'all'
                    ? selectedOrganizationId
                    : user?.organizationId,
            })
            await fetchSites()
        } catch (error) {
            console.error('Failed to create site:', error)
        }
    }

    const handleEditSite = async (siteId: string, data: Pick<Site, 'name' | 'address'>) => {
        try {
            await updateSite(siteId, data)
            await fetchSites()
        } catch (error) {
            console.error('Failed to update site:', error)
        }
    }

    const handleDeleteSite = async (siteId: string) => {
        try {
            await deleteSite(siteId)
            await fetchSites()
        } catch (error) {
            console.error('Failed to delete site:', error)
        }
    }

    // Compound handlers
    const handleCreateCompound = async (siteId: string, data: { name: string }) => {
        try {
            await createCompound(siteId, data)
            await fetchSites()
        } catch (error) {
            console.error('Failed to create compound:', error)
        }
    }

    const handleEditCompound = async (compoundId: string, data: { name: string }) => {
        try {
            await updateCompound(compoundId, data)
            await fetchSites()
        } catch (error) {
            console.error('Failed to update compound:', error)
        }
    }

    const handleDeleteCompound = async (compoundId: string) => {
        try {
            await deleteCompound(compoundId)
            await fetchSites()
        } catch (error) {
            console.error('Failed to delete compound:', error)
        }
    }

    // Cell handlers
    const handleCreateCell = async (compoundId: string, data: Pick<Cell, 'name' | 'capacity'>) => {
        try {
            await createCell(compoundId, data)
            await fetchSites()
        } catch (error) {
            console.error('Failed to create cell:', error)
        }
    }

    const handleEditCell = async (cellId: string, data: Pick<Cell, 'name' | 'capacity'>) => {
        try {
            await updateCell(cellId, data)
            await fetchSites()
        } catch (error) {
            console.error('Failed to update cell:', error)
        }
    }

    const handleDeleteCell = async (cellId: string) => {
        try {
            await deleteCell(cellId)
            await fetchSites()
        } catch (error) {
            console.error('Failed to delete cell:', error)
        }
    }

    const totalCompounds = sites.reduce((acc, s) => acc + (s.compounds?.length ?? 0), 0)
    const totalCells = sites.reduce(
        (acc, s) => acc + (s.compounds?.reduce((a, c) => a + (c.cells?.length ?? 0), 0) ?? 0),
        0
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Sites</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage sites, compounds, and cells
                        </p>
                    </div>
                </div>
                <Button
                    onClick={openCreateSiteModal}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Site
                </Button>
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

                {sites.length > 0 ? (
                    <SitesList
                        sites={sites}
                        onCreateSite={handleCreateSite}
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
                            Get started by creating your first site
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
