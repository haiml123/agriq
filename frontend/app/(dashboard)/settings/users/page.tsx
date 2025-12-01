'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Shield, MoreVertical, Pencil, Trash2, Check } from 'lucide-react';

type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SITE_MANAGER' | 'VIEWER';

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organization?: string;
    status: 'active' | 'pending' | 'inactive';
    invitedAt?: string;
}

interface Organization {
    id: string;
    name: string;
}

const mockOrganizations: Organization[] = [
    { id: '1', name: 'Green Farms LTD' },
    { id: '2', name: 'Desert Storage Corp' },
    { id: '3', name: 'Midwest Grain Holdings' },
];

const mockUsers: User[] = [
    {
        id: '1',
        name: 'Rotem Plotkin',
        email: 'rotem@agriq.farm',
        role: 'ORG_ADMIN',
        organization: 'Green Farms LTD',
        status: 'active',
    },
    {
        id: '2',
        name: 'Amir Luski',
        email: 'amir@agriq.farm',
        role: 'SITE_MANAGER',
        organization: 'Green Farms LTD',
        status: 'active',
    },
    {
        id: '3',
        name: 'Sarah Stone',
        email: 'sarah@desertcorp.com',
        role: 'ORG_ADMIN',
        organization: 'Desert Storage Corp',
        status: 'active',
    },
    {
        id: '4',
        name: 'John Pending',
        email: 'john@example.com',
        role: 'VIEWER',
        organization: 'Green Farms LTD',
        status: 'pending',
        invitedAt: '2025-05-28',
    },
];

const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ORG_ADMIN: 'Admin',
    SITE_MANAGER: 'Site Manager',
    VIEWER: 'Viewer',
};

const roleStyles: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    ORG_ADMIN: 'bg-primary/10 text-primary border-primary/30',
    SITE_MANAGER: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    VIEWER: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const statusStyles = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('VIEWER');
    const [inviteOrganization, setInviteOrganization] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

    const handleInviteUser = async () => {
        if (!inviteEmail.trim() || !inviteName.trim() || !inviteOrganization) return;

        setIsLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newUser: User = {
            id: Date.now().toString(),
            name: inviteName,
            email: inviteEmail,
            role: inviteRole,
            organization: mockOrganizations.find(o => o.id === inviteOrganization)?.name,
            status: 'pending',
            invitedAt: new Date().toISOString().split('T')[0],
        };

        setUsers([...users, newUser]);
        setInviteSent(true);
        setIsLoading(false);

        setTimeout(() => {
            setInviteEmail('');
            setInviteName('');
            setInviteRole('VIEWER');
            setInviteOrganization('');
            setInviteSent(false);
            setIsInviteDialogOpen(false);
        }, 2000);
    };

    const handleDeleteUser = (id: string) => {
        setUsers(users.filter(user => user.id !== id));
    };

    const handleResendInvite = (userId: string) => {
        console.log('Resending invite to user:', userId);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Users and Roles</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage team access and permissions
                    </p>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>
                                Send an invitation email to add a new user to the platform
                            </DialogDescription>
                        </DialogHeader>

                        {inviteSent ? (
                            <div className="py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1">Invitation Sent!</h3>
                                <p className="text-sm text-muted-foreground">
                                    An invitation email has been sent to {inviteEmail}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="inviteName" className="text-sm font-medium text-foreground">
                                            Full Name
                                        </label>
                                        <Input
                                            id="inviteName"
                                            placeholder="Enter user's full name"
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="inviteEmail" className="text-sm font-medium text-foreground">
                                            Email Address
                                        </label>
                                        <Input
                                            id="inviteEmail"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Organization
                                        </label>
                                        <Select value={inviteOrganization} onValueChange={setInviteOrganization}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockOrganizations.map((org) => (
                                                    <SelectItem key={org.id} value={org.id}>
                                                        {org.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Role
                                        </label>
                                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                                                <SelectItem value="SITE_MANAGER">Site Manager</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {inviteRole === 'ORG_ADMIN' && 'Full access to organization settings and all sites'}
                                            {inviteRole === 'SITE_MANAGER' && 'Can manage assigned sites and view alerts'}
                                            {inviteRole === 'VIEWER' && 'Read-only access to assigned resources'}
                                        </p>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsInviteDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleInviteUser}
                                        disabled={!inviteEmail.trim() || !inviteName.trim() || !inviteOrganization || isLoading}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        {isLoading ? 'Sending...' : 'Send Invitation'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">User List</h2>
                    <p className="text-sm text-muted-foreground">
                        {users.length} user{users.length !== 1 ? 's' : ''} total
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="p-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-medium text-primary">
                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-foreground">{user.name}</h3>
                                            {user.status === 'pending' && (
                                                <Badge variant="outline" className={statusStyles.pending}>
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {user.organization && (
                                        <span className="text-sm text-muted-foreground">
                                            {user.organization}
                                        </span>
                                    )}
                                    <Badge variant="outline" className={roleStyles[user.role]}>
                                        {roleLabels[user.role]}
                                    </Badge>

                                    <div className="flex items-center gap-2">
                                        {user.status === 'pending' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleResendInvite(user.id)}
                                                className="text-xs"
                                            >
                                                <Mail className="w-3 h-3 mr-1" />
                                                Resend
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon-sm">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleDeleteUser(user.id)}
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

                {users.length === 0 && (
                    <div className="p-8 text-center">
                        <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-1">No users yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get started by inviting your first team member
                        </p>
                        <Button onClick={() => setIsInviteDialogOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
