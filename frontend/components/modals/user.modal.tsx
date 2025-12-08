import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { useUserApi } from '@/hooks/use-user-api'
import { useOrganizationApi } from '@/hooks/use-organization-api'
import { RoleType, User } from '@/schemas/user.schema'
import { Organization } from '@/schemas/organization.schema'
import { useSession } from 'next-auth/react';

interface UserModalProps {
    user?: User
    onClose: (result?: User | null) => void
}

export function UserModal({ user, onClose }: UserModalProps) {
    const { data: session } = useSession();
    console.log('session', session);
    const { create, update, isCreating } = useUserApi()
    const { getList: getOrganizations } = useOrganizationApi()

    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
        organizationId: user?.organizationId || '',
        role: (user?.roles?.[0]?.role as RoleType) || 'OPERATOR',
        languagePreference: user?.languagePreference || '',
    })

    const isEditing = !!user

    useEffect(() => {
        getOrganizations().then((response) => {
            if (response?.data?.items) {
                setOrganizations(response.data.items)
            }
        })
    }, [])

    const handleSubmit = async () => {
        if (isEditing) {
            const response = await update(user.id, {
                name: formData.name,
                phone: formData.phone || undefined,
                password: formData.password || undefined,
                role: formData.role,
                languagePreference: formData.languagePreference || undefined,
            })
            if (response?.data) {
                onClose(response.data)
            }
        } else {
            const response = await create({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                organizationId: formData.organizationId,
                role: formData.role,
                languagePreference: formData.languagePreference || undefined,
            })
            if (response?.data) {
                onClose(response.data)
            }
        }
    }

    const isValid =
        formData.name.trim() &&
        formData.email.trim() &&
        formData.organizationId &&
        formData.role &&
        (isEditing || formData.password.trim())

    return (
        <>
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? 'Update user information and role.'
                        : 'Add a new user to the platform.'}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Name *</label>
                    <Input
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <Input
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        {isEditing ? 'New Password' : 'Password *'}
                    </label>
                    <Input
                        type="password"
                        placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <Input
                        placeholder="+1-555-1234"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Organization *</label>
                    <Select
                        value={formData.organizationId}
                        onValueChange={(value) => setFormData({ ...formData, organizationId: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Role *</label>
                    <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value as RoleType })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                            <SelectItem value="OPERATOR">Operator</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => onClose()}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isCreating}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {isCreating ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
                </Button>
            </DialogFooter>
        </>
    )
}