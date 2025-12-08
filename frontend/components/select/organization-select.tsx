'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganizationApi } from '@/hooks'
import { Organization } from '@/schemas/organization.schema'

interface OrganizationSelectProps {
    value: string
    onChange: (value: string) => void
    className?: string
}

export function OrganizationSelect({ value, onChange, className }: OrganizationSelectProps) {
    const { getList: getOrganizations } = useOrganizationApi()
    const [organizations, setOrganizations] = useState<Organization[]>([])

    useEffect(() => {
        getOrganizations().then((response) => {
            if (response?.data?.items) {
                setOrganizations(response.data.items)
            }
        })
    }, [getOrganizations])

    return (
        <div className={className}>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    {organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                            {organization.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}