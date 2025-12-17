'use client';

import { ScopeType, ScopeTypeEnum } from '@/schemas/trigger.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Organization } from '@/schemas/organization.schema';

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
            const defaultOrgId = organizationId ?? organizations?.[0]?.id;
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
                    <Select
                        value={organizationId}
                        onValueChange={handleOrganizationChange}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {(!organizations || organizations.length === 0) && (
                                <SelectItem value="" disabled>
                                    No organizations available
                                </SelectItem>
                            )}
                            {organizations?.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
