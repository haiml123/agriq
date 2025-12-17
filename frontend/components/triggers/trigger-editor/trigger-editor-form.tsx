'use client';

import { type Trigger } from '@/schemas/trigger.schema';
import { ValidationErrors } from './validation-errors';
import { BasicInfoSection } from './basic-info-section';
import { ConditionsSection } from './conditions-section';
import { NotificationActionsSection } from './notification-actions-section';
import { MessageTemplatesSection } from './message-templates-section';
import { RulePreview } from './rule-preview';
import { FormActions } from './form-actions';
import { useTriggerForm } from '@/components/triggers/trigger-editor/hooks/use-trigger-form';
import type { Organization } from '@/schemas/organization.schema';

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

            <RulePreview trigger={formData} />

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
