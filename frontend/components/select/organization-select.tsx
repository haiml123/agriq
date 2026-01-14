'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizationApi } from '@/hooks'
import { Organization } from '@/schemas/organization.schema'

interface OrganizationSelectProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
    includeAll?: boolean
    allLabel?: string
    emptyLabel?: string
    disabled?: boolean
    organizations?: Organization[]
}

export function OrganizationSelect({
    value,
    onChange,
    className,
    placeholder = 'Select organization',
    includeAll = true,
    allLabel = 'All organizations',
    emptyLabel = 'No organizations available',
    disabled,
    organizations,
}: OrganizationSelectProps) {
    const { getList: getOrganizations } = useOrganizationApi()
    const [internalOrganizations, setInternalOrganizations] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (organizations) {
            return
        }

        let isActive = true
        setIsLoading(true)
        getOrganizations()
            .then((response) => {
                if (!isActive) {
                    return
                }
                if (response?.data?.items) {
                    setInternalOrganizations(response.data.items)
                } else {
                    setInternalOrganizations([])
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [getOrganizations, organizations])

    const orgs = organizations ?? internalOrganizations
    const isEmpty = !isLoading && orgs.length === 0

    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
                    {isLoading && (
                        <SelectItem value="loading" disabled>
                            Loading organizations...
                        </SelectItem>
                    )}
                    {isEmpty && (
                        <SelectItem value="no-organizations" disabled>
                            {emptyLabel}
                        </SelectItem>
                    )}
                    {orgs.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                            {organization.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
