'use client'

import { Button } from '@/components/ui/button'
import { Building2, ChevronRight, MapPin, Plus, Users } from 'lucide-react'

export interface User {
    id: string
    name: string
    email: string
    phone?: string
    role: UserRole
    status: "active" | "pending"
    createdAt: string
}

export interface Organization {
    id: string
    name: string
    createdAt: string
    sitesCount: number
    users: User[]
}

export type UserRole = "ORG_ADMIN" | "SITE_MANAGER" | "VIEWER"

interface OrganizationsTabProps {
    organizations: Organization[]
    onCreateClick: () => void
    onOrganizationClick: (org: Organization) => void
}

export function OrganizationsTab({ organizations, onCreateClick, onOrganizationClick }: OrganizationsTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">Organizations</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {organizations.length} organization{organizations.length !== 1 ? "s" : ""} registered
                    </p>
                </div>
                <Button onClick={onCreateClick}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                </Button>
            </div>

            <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => onOrganizationClick(org)}
                        className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">{org.name}</h3>
                                    <p className="text-sm text-muted-foreground">Created {org.createdAt}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span>{org.sitesCount} sites</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>{org.users.length} users</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                ))}

                {organizations.length === 0 && (
                    <div className="p-12 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No organizations yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first organization</p>
                        <Button onClick={onCreateClick}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Organization
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
