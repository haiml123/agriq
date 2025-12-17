'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Trigger, type TriggerCommodityType } from '@/schemas/trigger.schema';
import { ValidationErrors } from './validation-errors';
import { BasicInfoSection } from './basic-info-section';
import { ConditionsSection } from './conditions-section';
import { NotificationActionsSection } from './notification-actions-section';
import { MessageTemplatesSection } from './message-templates-section';
import { RulePreview } from './rule-preview';
import { FormActions } from './form-actions';
import { useTriggerForm } from '@/components/triggers/trigger-editor/hooks/use-trigger-form';
import type { Organization } from '@/schemas/organization.schema';
import type { CommodityType } from '@/schemas/commodity-type.schema';
import { useCommodityTypeApi } from '@/hooks/use-commodity-type-api';

interface TriggerEditorFormProps {
    trigger: Trigger | null;
    onSave: (trigger: Trigger) => Promise<void> | void;
    onCancel: () => void;
    isLoading?: boolean;
    organizations?: Organization[];
}

export function TriggerEditorForm({
    trigger,
    onSave,
    onCancel,
    isLoading,
    organizations,
}: TriggerEditorFormProps) {
    const { getList: getCommodityTypes, isLoading: isCommodityTypesLoading } = useCommodityTypeApi();
    const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([]);
    const commodityTypeOptions: TriggerCommodityType[] = useMemo(
        () => commodityTypes.map(({ id, name }) => ({ id, name })),
        [commodityTypes]
    );

    const {
        formData,
        errors,
        updateField,
        addCondition,
        updateCondition,
        removeCondition,
        toggleAction,
        updateActionTemplate,
        validateAndSubmit,
    } = useTriggerForm(trigger);

    useEffect(() => {
        const loadCommodityTypes = async () => {
            const response = await getCommodityTypes({ limit: 100 });
            if (response?.data?.items) {
                setCommodityTypes(response.data.items);
            }
        };

        void loadCommodityTypes();
    }, [getCommodityTypes]);

    const handleSubmit = async () => {
        const validatedTrigger = validateAndSubmit();
        if (validatedTrigger) {
            await onSave(validatedTrigger);
        }
    };

    const handleScopeChange = (updates: {
        scopeType: Trigger['scopeType'];
        organizationId?: string;
        siteId?: string;
    }) => {
        updateField('scopeType', updates.scopeType);
        if (updates.organizationId !== undefined) {
            updateField('organizationId', updates.organizationId);
        }
        if (updates.siteId !== undefined) {
            updateField('siteId', updates.siteId);
        }
    };

    const isFormValid =
        formData.name.trim() !== '' &&
        formData.commodityTypeId.trim() !== '' &&
        formData.conditions.length > 0 &&
        formData.actions.length > 0;

    return (
        <div className="space-y-6">
            <ValidationErrors errors={errors} />

            <BasicInfoSection
                formData={formData}
                onUpdate={updateField}
                onScopeChange={handleScopeChange}
                organizations={organizations}
                commodityTypes={commodityTypeOptions}
                isCommodityTypesLoading={isCommodityTypesLoading}
            />

            <ConditionsSection
                conditions={formData.conditions}
                conditionLogic={formData.conditionLogic}
                onAddCondition={addCondition}
                onUpdateCondition={updateCondition}
                onRemoveCondition={removeCondition}
                onUpdateLogic={(logic) => updateField('conditionLogic', logic)}
            />

            <NotificationActionsSection
                actions={formData.actions}
                onToggle={toggleAction}
            />

            <MessageTemplatesSection
                actions={formData.actions}
                onUpdateTemplate={updateActionTemplate}
            />

            <RulePreview trigger={formData} commodityTypes={commodityTypeOptions} />

            <FormActions
                isEditing={trigger !== null}
                isLoading={isLoading}
                isValid={isFormValid}
                onCancel={onCancel}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
