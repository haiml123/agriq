'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useModal } from '@/components/providers/modal-provider';
import { CreateOrganizationModal } from '@/components/modals/create-org.modal';
import { useOrganizationApi } from '@/hooks';
import { Organization } from '@/schemas/organization.schema';

export default function OrganizationsPage() {
    const modal = useModal();
    const {create, getList, isLoading, isCreating} = useOrganizationApi();
    const [organizations, setOrganizations] = useState<Organization[]>([])


    useEffect(()=> {
        getList().then((response) => {
            if (response?.data?.items) {
                setOrganizations(response.data.items);
            }
        })
    }, []);

    const handleCreateOrganization = async (newOrgName: string) => {
        if (!newOrgName.trim()) return


        await create({name: newOrgName});

        const response = await getList();

        if (response?.data?.items) {
            setOrganizations(response.data.items);
        }
    }

    const handleDeleteOrganization = (id: string) => {
        setOrganizations(organizations.filter((org) => org.id !== id))
    }

    const createOrg = async () => {
        const result = await modal.open<string>((onClose) => (
            <CreateOrganizationModal onClose={onClose} />
        ));
        if (result) {
          await  handleCreateOrganization(result);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage organizations and their settings</p>
                    </div>
                </div>
                <Button isLoading={isCreating} onClick={createOrg} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">All Organizations</h2>
                    <p className="text-sm text-muted-foreground">
                        {organizations.length} organization{organizations.length !== 1 ? "s" : ""} registered
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {organizations.map((org) => (
                        <div key={org.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">{org.name}</h3>
                                        <p className="text-sm text-muted-foreground">Created {org.createdAt}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="hidden md:flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>0 sites</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            <span>0 users</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteOrganization(org.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {organizations.length === 0 && (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No organizations yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first organization</p>
                        <Button onClick={createOrg} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Organization
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
