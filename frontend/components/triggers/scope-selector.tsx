'use client';

import { ScopeType, ScopeTypeEnum } from '@/schemas/trigger.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Organization } from '@/schemas/organization.schema';
import { OrganizationSelect } from '@/components/select/organization-select';

interface ScopeSelectorProps {
    scopeType: ScopeType;
    organizationId?: string;
    siteId?: string;
    onScopeChange: (updates: {
        scopeType: ScopeType;
        organizationId?: string;
    }) => void;
    organizations?: Organization[];
}

export function ScopeSelector({
                                  scopeType,
                                  organizationId,
                                  onScopeChange,
                                  organizations,
                              }: ScopeSelectorProps) {

    const handleScopeTypeChange = (newScopeType: ScopeType) => {
        if (newScopeType === ScopeTypeEnum.ORGANIZATION) {
            const hasOrganizations = Boolean(organizations?.length);
            const defaultOrgId = hasOrganizations ? (organizationId ?? organizations?.[0]?.id) : undefined;
            onScopeChange({ scopeType: newScopeType, organizationId: defaultOrgId });
        } else {
            onScopeChange({ scopeType: newScopeType, organizationId: undefined });
        }
    };

    const handleOrganizationChange = (newOrgId: string) => {
        onScopeChange({ scopeType, organizationId: newOrgId });
    };

    return (
        <div className="flex items-end gap-3">
            {/* Scope Type */}
            <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                    value={scopeType}
                    onValueChange={(v) => handleScopeTypeChange(v as ScopeType)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ScopeTypeEnum.ALL}>All Organizations</SelectItem>
                        <SelectItem value={ScopeTypeEnum.ORGANIZATION}>Specific Organization</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {scopeType === ScopeTypeEnum.ORGANIZATION && (
                <div className="space-y-2">
                    <Label>Organization</Label>
                    <OrganizationSelect
                        value={organizationId}
                        onChange={handleOrganizationChange}
                        className="w-[200px]"
                        placeholder="Select organization"
                        includeAll={false}
                        organizations={organizations}
                        emptyLabel="No organizations available"
                    />
                </div>
            )}
        </div>
    );
}
