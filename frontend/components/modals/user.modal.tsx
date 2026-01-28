import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useState } from 'react'
import { useUserApi } from '@/hooks/use-user-api'
import { useOrganizationApi } from '@/hooks/use-organization-api'
import { useSiteApi } from '@/hooks/use-site-api'
import { User } from '@/schemas/user.schema'
import { Organization } from '@/schemas/organization.schema'
import { Site } from '@/schemas/sites.schema'
import { useCurrentUser } from '@/hooks'
import { Loader2 } from 'lucide-react'
import { RoleType, RoleTypeEnum } from '@/schemas/common.schema';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { resolveLocaleText } from '@/utils/locale';

interface UserModalProps {
    user?: User
    onClose: (result?: User | null) => void
}

export function UserModal({ user, onClose }: UserModalProps) {
    const t = useTranslations('modals.user');
    const tCommon = useTranslations('common');
    const tRoles = useTranslations('roles');
    const tToast = useTranslations('toast.user');
    const locale = useLocale();
    const { user: appUser, isSuperAdmin, isAdmin } = useCurrentUser()
    const { create, update, isCreating } = useUserApi()
    const { getList: getOrganizations } = useOrganizationApi()
    const { getSites, isLoading: isLoadingSites } = useSiteApi()

    const [organizations, setOrganizations] = useState<Organization[]>([])
    
    const [sites, setSites] = useState<Site[]>([])

    // Determine initial site selection based on existing user roles
    const getInitialSiteIds = (): string[] => {
        if (!user?.siteUsers?.length) return []
        return user.siteUsers.map((assignment) => assignment.siteId)
    }

    const getInitialRole = (): RoleType => {
        return user?.userRole || RoleTypeEnum.OPERATOR
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

    // Load sites based on organization (real API call)
    useEffect(() => {
        const orgId = formData.organizationId
        if (orgId) {
            getSites({ organizationId: orgId }).then((response) => {
                if (response?.data) {
                    setSites(response.data)
                } else {
                    setSites([])
                }
            }).catch((error) => {
                console.error('Failed to fetch sites:', error)
                setSites([])
            })
        } else {
            setSites([])
        }
    }, [formData.organizationId, getSites])

    // Auto-set organization for non-super-admin
    useEffect(() => {
        const shouldUpdateOrg = !isSuperAdmin &&
            appUser?.organizationId &&
            !formData.organizationId &&
            appUser.organizationId !== formData.organizationId;

        if (shouldUpdateOrg) {
            setFormData(prev => ({ ...prev, organizationId: appUser.organizationId! }))
        }
    }, [isSuperAdmin, appUser?.organizationId])

    const handleSiteToggle = (siteId: string) => {
        setSitesModified(true)
        setFormData(prev => {
            const newSiteIds = prev.siteIds.includes(siteId)
                ? prev.siteIds.filter(id => id !== siteId)
                : [...prev.siteIds, siteId]
            return { ...prev, siteIds: newSiteIds }
        })
    }

    const handleRoleChange = (value: RoleType) => {
        setRoleModified(true)
        setSitesModified(true)
        setFormData({
            ...formData,
            role: value,
            siteIds: value === RoleTypeEnum.OPERATOR ? formData.siteIds : []
        })
    }

    const handleSubmit = async () => {
        const actualSiteIds = formData.siteIds

        if (isEditing) {
            const payload: Record<string, any> = {
                name: formData.name,
                phone: formData.phone || undefined,
                languagePreference: formData.languagePreference || undefined,
            }

            // Only include password if provided
            if (formData.password) {
                payload.password = formData.password
            }

            if (roleModified || sitesModified) {
                payload.role = formData.role
                if (formData.role === RoleTypeEnum.OPERATOR) {
                    payload.siteIds = actualSiteIds
                }
            }

            const response = await update(user.id, payload)
            if (response?.data) {
                toast.success(tToast('updateSuccess'))
                onClose(response.data)
            } else {
                toast.error(response?.error || tToast('updateError'))
            }
        } else {
            const payload: Record<string, any> = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                organizationId: formData.organizationId,
                role: formData.role,
                languagePreference: formData.languagePreference || undefined,
            }

            if (formData.role === RoleTypeEnum.OPERATOR) {
                payload.siteIds = actualSiteIds
            }

            const response = await create(payload as any)
            if (response?.data) {
                toast.success(tToast('createSuccess'))
                onClose(response.data)
            } else {
                toast.error(response?.error || tToast('createError'))
            }
        }
    }

    const hasValidSiteSelection = formData.role !== RoleTypeEnum.OPERATOR || formData.siteIds.length > 0

    const requiresOrganization = formData.role !== RoleTypeEnum.SUPER_ADMIN

    const isValid =
        formData.name.trim() &&
        formData.email.trim() &&
        (!requiresOrganization || formData.organizationId) &&
        formData.role &&
        (isEditing || formData.password.trim()) &&
        hasValidSiteSelection

    // Determine which roles the current user can assign
    const availableRoles = isSuperAdmin
        ? [RoleTypeEnum.SUPER_ADMIN, RoleTypeEnum.ADMIN, RoleTypeEnum.OPERATOR]
        : [RoleTypeEnum.ADMIN, RoleTypeEnum.OPERATOR]

    return (
        <>
            <DialogHeader>
                <DialogTitle>{isEditing ? t('editTitle') : t('createTitle')}</DialogTitle>
                <DialogDescription>
                    {isEditing
                        ? t('editDescription')
                        : t('createDescription')}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('nameRequired')}</label>
                    <Input
                        placeholder={t('namePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('emailRequired')}</label>
                    <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        {isEditing ? t('newPassword') : t('passwordRequired')}
                    </label>
                    <Input
                        type="password"
                        placeholder={isEditing ? t('passwordPlaceholderEdit') : t('passwordPlaceholder')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('phone')}</label>
                    <Input
                        placeholder={t('phonePlaceholder')}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                {/* Organization select - only for super admin */}
                {isSuperAdmin && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">{t('organizationRequired')}</label>
                        <Select
                            value={formData.organizationId}
                            onValueChange={(value) => setFormData({
                                ...formData,
                                organizationId: value,
                                siteIds: []
                            })}
                            disabled={isEditing}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('selectOrganization')} />
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
                    <label className="text-sm font-medium text-foreground">{t('roleRequired')}</label>
                    <Select
                        value={formData.role}
                        onValueChange={(value) => handleRoleChange(value as RoleType)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRoles.includes(RoleTypeEnum.SUPER_ADMIN) && (
                                <SelectItem value={RoleTypeEnum.SUPER_ADMIN}>{tRoles('SUPER_ADMIN')}</SelectItem>
                            )}
                            <SelectItem value={RoleTypeEnum.ADMIN}>{tRoles('ADMIN')}</SelectItem>
                            <SelectItem value={RoleTypeEnum.OPERATOR}>{tRoles('OPERATOR')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.role === RoleTypeEnum.OPERATOR && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                                {t('siteAccessRequired')}
                            </label>
                            <span className="text-xs text-muted-foreground">
                                {t('sitesSelected', { count: formData.siteIds.length })}
                            </span>
                        </div>

                        {isLoadingSites ? (
                            <div className="flex items-center justify-center py-8 border rounded-lg bg-muted/30">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">{t('loadingSites')}</span>
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden bg-muted/30">
                                {sites.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto">
                                        {sites.map((site) => (
                                            <label
                                                key={site.id}
                                                className={`flex items-center gap-3 py-2.5 px-3 cursor-pointer transition-colors ${
                                                    formData.siteIds.includes(site.id)
                                                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                                        : 'hover:bg-muted/50'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={formData.siteIds.includes(site.id)}
                                                    onCheckedChange={() => handleSiteToggle(site.id)}
                                                />
                                                <span className="text-sm">
                                                    {resolveLocaleText(site.locale, locale, site.name)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            {t('noSitesFound')}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('createSitesFirst')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasValidSiteSelection && (
                            <p className="text-xs text-destructive">
                                {t('selectAtLeastOneSite')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => onClose()}>
                    {tCommon('cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isCreating}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {isCreating ? tCommon('saving') : isEditing ? t('saveButton') : t('createButton')}
                </Button>
            </DialogFooter>
        </>
    )
}
