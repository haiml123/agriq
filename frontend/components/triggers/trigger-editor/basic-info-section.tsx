import type { Trigger, TriggerCommodityType } from '@/schemas/trigger.schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeverityEnum, type Severity } from '@/schemas/common.schema';
import { ScopeSelector } from '@/components/triggers';
import type { Organization } from '@/schemas/organization.schema';
import { CommodityTypeSelect } from '@/components/select/commodity-type-select';

interface BasicInfoSectionProps {
    formData: Trigger;
    onUpdate: <K extends keyof Trigger>(field: K, value: Trigger[K]) => void;
    onScopeChange: (updates: { scopeType: Trigger['scopeType']; organizationId?: string; siteId?: string }) => void;
    organizations?: Organization[];
    commodityTypes: TriggerCommodityType[];
    isCommodityTypesLoading?: boolean;
}

const SEVERITY_OPTIONS = [
    { value: SeverityEnum.LOW, label: 'Low', color: 'bg-emerald-500' },
    { value: SeverityEnum.MEDIUM, label: 'Medium', color: 'bg-amber-500' },
    { value: SeverityEnum.HIGH, label: 'High', color: 'bg-orange-500' },
    { value: SeverityEnum.CRITICAL, label: 'Critical', color: 'bg-red-500' },
] as const;

export function BasicInfoSection({
    formData,
    onUpdate,
    onScopeChange,
    organizations,
    commodityTypes,
    isCommodityTypesLoading,
}: BasicInfoSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Basic Information
            </h3>

            <div className="space-y-2">
                <Label htmlFor="name">Trigger Name *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    placeholder="e.g., High Temperature Alert"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => onUpdate('description', e.target.value)}
                    placeholder="Describe when and why this trigger should fire..."
                    rows={2}
                    className="resize-none"
                />
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <SeveritySelect
                    value={formData.severity}
                    onChange={(v) => onUpdate('severity', v)}
                />

                <CommodityTypeSelect
                    value={formData.commodityTypeId}
                    onChange={(v) => onUpdate('commodityTypeId', v)}
                    commodityTypes={commodityTypes}
                    isLoading={isCommodityTypesLoading}
                    placeholder="Select commodity type"
                    triggerClassName="w-[180px]"
                />

                <ScopeSelector
                    scopeType={formData.scopeType}
                    organizationId={formData.organizationId}
                    onScopeChange={onScopeChange}
                    organizations={organizations}
                />
            </div>
        </div>
    );
}

function SeveritySelect({
    value,
    onChange,
}: {
    value: Severity;
    onChange: (value: Severity) => void;
}) {
    return (
        <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={value} onValueChange={(v) => onChange(v as Severity)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                    {SEVERITY_OPTIONS.map(({ value, label, color }) => (
                        <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${color}`} />
                                {label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
