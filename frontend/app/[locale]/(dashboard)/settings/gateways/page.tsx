'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Cpu, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useCurrentUser } from '@/hooks'
import { useGatewayApi } from '@/hooks/use-gateway-api'
import { OrganizationSelect } from '@/components/select/organization-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Gateway } from '@/schemas/sites.schema'
import { EntityStatusEnum } from '@/schemas/common.schema'
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout'

export default function GatewaysSettingsPage() {
    const t = useTranslations('pages.settingsGateways')
    const tToast = useTranslations('toast.gateway')
    const { user, isSuperAdmin, isAdmin, isLoading: isCurrentUserLoading } = useCurrentUser()
    const { getGateways, registerGateway, isLoading, isUpdating } = useGatewayApi()
    const [gateways, setGateways] = useState<Gateway[]>([])
    const [externalId, setExternalId] = useState('')
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all')
    const [registerOrganizationId, setRegisterOrganizationId] = useState<string>('all')

    const organizationId = useMemo(() => {
        if (isSuperAdmin) {
            return selectedOrganizationId !== 'all' ? selectedOrganizationId : undefined
        }
        return user?.organizationId
    }, [isSuperAdmin, selectedOrganizationId, user?.organizationId])

    const loadGateways = useCallback(async () => {
        if (isCurrentUserLoading || !user) return
        if (!organizationId && !isSuperAdmin) {
            setGateways([])
            return
        }
        const response = await getGateways(organizationId ? { organizationId } : undefined)
        if (response?.data) {
            setGateways(response.data as Gateway[])
        }
    }, [getGateways, isCurrentUserLoading, organizationId, user, isSuperAdmin])

    useEffect(() => {
        loadGateways()
    }, [loadGateways])

    const handleRegister = async () => {
        if (isSuperAdmin && registerOrganizationId === 'all') {
            toast.error(t('selectOrganization'))
            return
        }
        const trimmedId = externalId.trim()
        if (!trimmedId) {
            toast.error(tToast('registerError'))
            return
        }
        const response = await registerGateway({
            externalId: trimmedId,
            organizationId: isSuperAdmin ? registerOrganizationId : undefined,
        })
        if (response?.data) {
            setExternalId('')
            await loadGateways()
            toast.success(tToast('registerSuccess'))
        } else {
            toast.error(response?.error || tToast('registerError'))
        }
    }

    if (!isSuperAdmin && !isAdmin) {
        return null
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
                    </div>
                </div>
                {isSuperAdmin && (
                    <OrganizationSelect
                        value={selectedOrganizationId}
                        onChange={setSelectedOrganizationId}
                        className="w-full max-w-[16rem]"
                    />
                )}
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('registerLabel')}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {isSuperAdmin && (
                        <OrganizationSelect
                            value={registerOrganizationId}
                            onChange={setRegisterOrganizationId}
                            className="w-full md:w-64"
                        />
                    )}
                    <Input
                        value={externalId}
                        onChange={(event) => setExternalId(event.target.value)}
                        placeholder={t('registerPlaceholder')}
                    />
                    <Button
                        onClick={handleRegister}
                        disabled={
                            !externalId.trim()
                            || isUpdating
                            || isLoading
                            || (isSuperAdmin && registerOrganizationId === 'all')
                        }
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('registerButton')}
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-start">{t('tableExternalId')}</TableHead>
                            <TableHead className="text-start">{t('tableStatus')}</TableHead>
                            {isSuperAdmin && <TableHead className="text-start">{t('tableOrganization')}</TableHead>}
                            <TableHead className="text-start">{t('tableCell')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gateways.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={isSuperAdmin ? 4 : 3}
                                    className="text-center text-sm text-muted-foreground"
                                >
                                    {t('empty')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            gateways.map((gateway) => (
                                <TableRow key={gateway.id}>
                                    <TableCell>{gateway.externalId}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                gateway.status === EntityStatusEnum.ACTIVE
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : gateway.status === EntityStatusEnum.BLOCKED
                                                        ? 'bg-amber-500/10 text-amber-500'
                                                        : 'bg-red-500/10 text-red-500'
                                            }`}
                                        >
                                            {gateway.status}
                                        </span>
                                    </TableCell>
                                    {isSuperAdmin && (
                                        <TableCell>
                                            {gateway.organization?.name || t('unregisteredOrg')}
                                        </TableCell>
                                    )}
                                    <TableCell>{gateway.cell?.name || t('unpaired')}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
