import { useState, useCallback } from 'react';
import {
    type Action,
    type ActionType,
    type Condition,
    type Trigger,
    createDefaultAction,
    createDefaultCondition,
    createDefaultTrigger,
    hasActionType,
    TriggerSchema,
} from '@/schemas/trigger.schema';

export interface UseTriggerFormReturn {
    formData: Trigger;
    errors: string[];
    updateField: <K extends keyof Trigger>(field: K, value: Trigger[K]) => void;
    addCondition: () => void;
    updateCondition: (index: number, condition: Condition) => void;
    removeCondition: (index: number) => void;
    toggleAction: (actionType: ActionType) => void;
    updateActionTemplate: (actionType: ActionType, template: Action['template']) => void;
    validateAndSubmit: () => Trigger | null;
    clearErrors: () => void;
}

export function useTriggerForm(initialTrigger: Trigger | null): UseTriggerFormReturn {
    const [formData, setFormData] = useState<Trigger>(initialTrigger || createDefaultTrigger());
    const [errors, setErrors] = useState<string[]>([]);

    const updateField = useCallback(<K extends keyof Trigger>(field: K, value: Trigger[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const addCondition = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            conditions: [...prev.conditions, createDefaultCondition()],
        }));
    }, []);

    const updateCondition = useCallback((index: number, condition: Condition) => {
        setFormData((prev) => {
            const newConditions = [...prev.conditions];
            newConditions[index] = condition;
            return { ...prev, conditions: newConditions };
        });
    }, []);

    const removeCondition = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index),
        }));
    }, []);

    const toggleAction = useCallback((actionType: ActionType) => {
        setFormData((prev) => {
            if (hasActionType(prev.actions, actionType)) {
                return { ...prev, actions: prev.actions.filter((a) => a.type !== actionType) };
            }
            return { ...prev, actions: [...prev.actions, createDefaultAction(actionType)] };
        });
    }, []);

    const updateActionTemplate = useCallback((actionType: ActionType, template: Action['template']) => {
        setFormData((prev) => ({
            ...prev,
            actions: prev.actions.map((a) => (a.type === actionType ? { ...a, template } : a)),
        }));
    }, []);

    const validateAndSubmit = useCallback((): Trigger | null => {
        const dataToValidate = { ...formData, id: formData.id || `trig_${Date.now()}` };
        const result = TriggerSchema.safeParse(dataToValidate);

        if (!result.success) {
            setErrors(result.error.issues.map((e) => e.message));
            return null;
        }

        setErrors([]);
        return result.data;
    }, [formData]);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    return {
        formData,
        errors,
        updateField,
        addCondition,
        updateCondition,
        removeCondition,
        toggleAction,
        updateActionTemplate,
        validateAndSubmit,
        clearErrors,
    };
}
