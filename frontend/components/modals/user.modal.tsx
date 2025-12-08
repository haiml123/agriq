import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useState } from 'react'
import { useUserApi } from '@/hooks/use-user-api'
import { useOrganizationApi } from '@/hooks/use-organization-api'
import { RoleType, User } from '@/schemas/user.schema'
import { Organization } from '@/schemas/organization.schema'
import { useCurrentUser } from '@/hooks'
import { Building2 } from 'lucide-react'

// Static sites data for UI preview - TODO: Replace with API call
const STATIC_SITES = [
    { id: 'site-1', name: 'Northern Storage Facility', organizationId: 'org-1' },
    { id: 'site-2', name: 'Southern Distribution Center', organizationId: 'org-1' },
    { id: 'site-3', name: 'Eastern Grain Depot', organizationId: 'org-1' },
    { id: 'site-4', name: 'Western Processing Plant', organizationId: 'org-1' },
    { id: 'site-5', name: 'Central Hub', organizationId: 'org-2' },
]

// Internal marker for "All Sites" selection (org-level access)
const ALL_SITES_OPTION = '__ALL_SITES__'

interface Site {
    id: string
    name: string
    organizationId: string
}

interface UserModalProps {
    user?: User
    onClose: (result?: User | null) => void
}

export function UserModal({ user, onClose }: UserModalProps) {
    const { user: appUser, isSuperAdmin, isAdmin } = useCurrentUser()
    const { create, update, isCreating } = useUserApi()
    const { getList: getOrganizations } = useOrganizationApi()

    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [sites, setSites] = useState<Site[]>([])

    // Determine initial site selection based on existing user roles
    const getInitialSiteIds = (): string[] => {
        if (!user?.roles?.length) return [ALL_SITES_OPTION]
        // Only check OPERATOR roles for site-level access
        const operatorRoles = user.roles.filter(r => r.role === 'OPERATOR')
        if (operatorRoles.length === 0) return [ALL_SITES_OPTION]

        // If any OPERATOR role has siteId = null, it's org-level access
        const hasOrgLevelAccess = operatorRoles.some(r => !r.siteId)
        if (hasOrgLevelAccess) return [ALL_SITES_OPTION]

        // Otherwise, return specific site IDs
        return operatorRoles.map(r => r.siteId).filter(Boolean) as string[]
    }

    const getInitialRole = (): RoleType => {
        return (user?.roles?.[0]?.role as RoleType) || 'OPERATOR'
    }

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
        organizationId: user?.organizationId || appUser?.organizationId || '',
        role: getInitialRole(),
        siteIds: getInitialSiteIds(),
        languagePreference: user?.languagePreference || '',
    })

    // Track if role/sites were modified (for edit mode - only send changed fields)
    const [roleModified, setRoleModified] = useState(false)
    const [sitesModified, setSitesModified] = useState(false)

    const isEditing = !!user
    const isAllSitesSelected = formData.siteIds.includes(ALL_SITES_OPTION)

    // Fetch organizations only for super admin
    useEffect(() => {
        if (isSuperAdmin) {
            getOrganizations().then((response) => {
                if (response?.data?.items) {
                    setOrganizations(response.data.items)
                }
            })
        }
    }, [getOrganizations, isSuperAdmin])

    // Load sites based on organization (using static data for now)
    useEffect(() => {
        const orgId = formData.organizationId
        if (orgId) {
            // TODO: Replace with API call
            const filteredSites = STATIC_SITES.filter(s => s.organizationId === orgId)
            setSites(filteredSites.length > 0 ? filteredSites : STATIC_SITES)
        } else {
            setSites([])
        }
    }, [formData.organizationId])

    // Auto-set organization for non-super-admin
    useEffect(() => {
        if (!isSuperAdmin && appUser?.organizationId && !formData.organizationId) {
            setFormData(prev => ({ ...prev, organizationId: appUser.organizationId! }))
        }
    }, [isSuperAdmin, appUser, formData.organizationId])

    const handleAllSitesToggle = () => {
        setSitesModified(true)
        if (isAllSitesSelected) {
            // Deselect "All Sites" - clear selection
            setFormData(prev => ({ ...prev, siteIds: [] }))
        } else {
            // Select "All Sites" - clear individual sites
            setFormData(prev => ({ ...prev, siteIds: [ALL_SITES_OPTION] }))
        }
    }

    const handleSiteToggle = (siteId: string) => {
        setSitesModified(true)
        setFormData(prev => {
            const newSiteIds = prev.siteIds.includes(siteId)
                ? prev.siteIds.filter(id => id !== siteId)
                : [...prev.siteIds.filter(id => id !== ALL_SITES_OPTION), siteId]
            return { ...prev, siteIds: newSiteIds }
        })
    }

    const handleRoleChange = (value: RoleType) => {
        setRoleModified(true)
        setSitesModified(true) // Role change implies sites change too
        setFormData({
            ...formData,
            role: value,
            siteIds: [ALL_SITES_OPTION]
        })
    }

    const handleSubmit = async () => {
        // Convert ALL_SITES_OPTION to empty array for backend
        // Backend logic: empty siteIds = org-level access (siteId: null in UserRole)
        // Backend logic: populated siteIds = site-level access (one UserRole per site)
        const actualSiteIds = isAllSitesSelected ? [] : formData.siteIds

        if (isEditing) {
            // For updates: only send fields that changed
            const payload: Record<string, any> = {
                name: formData.name,
                phone: formData.phone || undefined,
                languagePreference: formData.languagePreference || undefined,
            }

            // Only include password if provided
            if (formData.password) {
                payload.password = formData.password
            }

            // Only include role/siteIds if they were modified
            // Backend checks: if (role || siteIds) { ... rebuild roles }
            if (roleModified || sitesModified) {
                payload.role = formData.role
                // Only send siteIds for OPERATOR role
                if (formData.role === 'OPERATOR') {
                    payload.siteIds = actualSiteIds
                }
            }

            const response = await update(user.id, payload)
            if (response?.data) {
                onClose(response.data)
            }
        } else {
            // For create: send all required fields
            const payload: Record<string, any> = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                organizationId: formData.organizationId,
                role: formData.role,
                languagePreference: formData.languagePreference || undefined,
            }

            // Only include siteIds for OPERATOR role
            if (formData.role === 'OPERATOR') {
                payload.siteIds = actualSiteIds
            }

            const response = await create(payload as any)
            if (response?.data) {
                onClose(response.data)
            }
        }
    }

    const hasValidSiteSelection = isAllSitesSelected || formData.siteIds.length > 0

    const isValid =
        formData.name.trim() &&
        formData.email.trim() &&
        formData.organizationId &&
        formData.role &&
        (isEditing || formData.password.trim()) &&
        (formData.role !== 'OPERATOR' || hasValidSiteSelection)

    // Determine which roles the current user can assign
    const availableRoles = isSuperAdmin
        ? ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']
        : ['ORG_ADMIN', 'OPERATOR']

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

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

                {/* Organization select - only for super admin */}
                {isSuperAdmin && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Organization *</label>
                        <Select
                            value={formData.organizationId}
                            onValueChange={(value) => setFormData({
                                ...formData,
                                organizationId: value,
                                siteIds: [ALL_SITES_OPTION]
                            })}
                            disabled={isEditing}
                        >
                            <SelectTrigger className="w-full">
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
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Role *</label>
                    <Select
                        value={formData.role}
                        onValueChange={(value) => handleRoleChange(value as RoleType)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRoles.includes('SUPER_ADMIN') && (
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            )}
                            <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                            <SelectItem value="OPERATOR">Operator</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Site Access - only for OPERATOR role */}
                {formData.role === 'OPERATOR' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                                Site Access *
                            </label>
                            {!isAllSitesSelected && formData.siteIds.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {formData.siteIds.length} site{formData.siteIds.length !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>

                        <div className="border rounded-lg overflow-hidden bg-muted/30">
                            {/* All Sites Option - First and separate */}
                            <label
                                className={`flex items-center gap-3 py-3 px-3 cursor-pointer transition-colors border-b ${
                                    isAllSitesSelected
                                        ? 'bg-emerald-500/10'
                                        : 'hover:bg-muted/50'
                                }`}
                            >
                                <Checkbox
                                    checked={isAllSitesSelected}
                                    onCheckedChange={handleAllSitesToggle}
                                />
                                <Building2 className="w-4 h-4 text-emerald-500" />
                                <div>
                                    <span className="text-sm font-medium">All Sites</span>
                                    <p className="text-xs text-muted-foreground">
                                        Access to all current and future sites
                                    </p>
                                </div>
                            </label>

                            {/* Individual Sites */}
                            <div className="max-h-40 overflow-y-auto">
                                {sites.map((site) => (
                                    <label
                                        key={site.id}
                                        className={`flex items-center gap-3 py-2.5 px-3 cursor-pointer transition-colors ${
                                            isAllSitesSelected
                                                ? 'opacity-50 cursor-not-allowed bg-muted/20'
                                                : formData.siteIds.includes(site.id)
                                                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                                    : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={isAllSitesSelected || formData.siteIds.includes(site.id)}
                                            onCheckedChange={() => handleSiteToggle(site.id)}
                                            disabled={isAllSitesSelected}
                                        />
                                        <span className="text-sm">{site.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {!hasValidSiteSelection && (
                            <p className="text-xs text-destructive">
                                Please select site access level
                            </p>
                        )}
                    </div>
                )}

                {formData.role === 'OPERATOR' && sites.length === 0 && formData.organizationId && (
                    <p className="text-sm text-muted-foreground py-2">
                        No sites found for this organization. Create sites first.
                    </p>
                )}
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