'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout'
import { useModal } from '@/components/providers/modal-provider'
import { UserModal } from '@/components/modals/user.modal'
import { useUserApi } from '@/hooks/use-user-api'
import { User as UserType } from '@/schemas/user.schema'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks';
import { OrganizationSelect } from '@/components/select/organization-select';
import { RoleTypeEnum } from '@/schemas/common.schema';

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    OPERATOR: 'Operator',
}

const roleStyles: Record<string, string> = {
    [RoleTypeEnum.SUPER_ADMIN]: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    [RoleTypeEnum.ADMIN]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    [RoleTypeEnum.OPERATOR]: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
}

export default function UsersPage() {
    const modal = useModal();
    const { user, isSuperAdmin, isAdmin, isLoading: isCurrentUserLoading } = useCurrentUser();
    const { getList, isCreating } = useUserApi();
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all')
    const canManageUsers = isSuperAdmin || isAdmin

    const fetchUsers = useCallback(async () => {
        console.log('fetchUsers');
        if (isCurrentUserLoading || !user || !canManageUsers) return

        try {
            const response = await getList({
                organizationId: isSuperAdmin && selectedOrganizationId !== 'all' ? selectedOrganizationId : undefined,
            });
            if (response?.data?.items) {
                setUsers(response.data.items)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [canManageUsers, getList, isCurrentUserLoading, isSuperAdmin, selectedOrganizationId, user]);

    useEffect(() => {
        const loadUsers = async () => {
            await fetchUsers();
        };
        loadUsers();
    }, [fetchUsers])

    const openUserModal = async (user?: UserType) => {
        const result = await modal.open<UserType | null>((onClose) => (
            <UserModal user={user} onClose={onClose} />
        ))
        if (result) {
            await fetchUsers()
        }
    }

    const handleDeleteUser = (id: string) => {
        setUsers(users.filter((user) => user.id !== id))
    }

    const getUserRole = (user: UserType) => {
        return user.userRole || 'OPERATOR'
    }

    if (!isCurrentUserLoading && !canManageUsers) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            You do not have permission to view users.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage users and their roles</p>
                    </div>
                </div>
                {canManageUsers && (
                    <Button isLoading={isCreating} onClick={() => openUserModal()} className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                    </Button>
                )}
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {users.length} user{users.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <div>
                            <OrganizationSelect
                                value={selectedOrganizationId}
                                onChange={setSelectedOrganizationId}
                                className="w-full md:w-64"
                            />
                        </div>
                    )}
                </div>
                <div className="divide-y divide-border">
                    {users.map((user) => {
                        const role = getUserRole(user)
                        return (
                            <div key={user.id} className="p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <span className="text-sm font-medium text-emerald-500">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                                                <Badge variant="outline" className={roleStyles[role]}>
                                                    {roleLabels[role]}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="hidden md:block text-sm text-muted-foreground">
                                            {user.organization?.name || 'No organization'}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openUserModal(user)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {users.length === 0 && (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No users yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get started by creating your first user</p>
                        {canManageUsers && (
                            <Button onClick={() => openUserModal()} className="bg-emerald-500 hover:bg-emerald-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Create User
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
