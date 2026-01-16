'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import { Action, Condition, Trigger } from '@/schemas/trigger.schema';
import { PaginatedResponse } from '@/schemas/organization.schema';

const basePath = '/events/triggers';

type ApiTriggerResponse = {
    id?: string;
    name?: string;
    description?: string | null;
    scopeType?: Trigger['scopeType'];
    organizationId?: string | null;
    siteId?: string | null;
    compoundId?: string | null;
    cellId?: string | null;
    commodityTypeId?: string | null;
    commodityType?: {
        id: string;
        name: string;
    } | null;
    conditionLogic?: Trigger['conditionLogic'];
    conditions?: (Condition & {
        timeWindowHours?: number;
    })[];
    actions?: (Action & {
        webhookUrl?: string;
        recipients?: string[];
    })[];
    severity?: Trigger['severity'];
    isActive?: boolean;
};

const mapConditionFromApi = (condition: any): Condition => ({
    id: condition?.id ?? '',
    metric: condition?.metric,
    type: condition?.type,
    operator: condition?.operator,
    value: condition?.value,
    secondaryValue: condition?.secondaryValue,
    changeDirection: condition?.changeDirection,
    changeAmount: condition?.changeAmount,
    timeWindowHours: condition?.timeWindowHours,
    valueSources: condition?.valueSources,
    sourceType: condition?.sourceType,
});

const mapActionFromApi = (action: any): Action => ({
    type: action?.type,
    template: action?.template,
    webhookUrl: action?.webhookUrl,
    recipients: action?.recipients,
});

const mapTriggerFromApi = (trigger: ApiTriggerResponse): Trigger => ({
    id: trigger.id ?? '',
    name: trigger.name ?? '',
    description: trigger.description ?? '',
    scopeType: trigger.scopeType ?? 'ALL',
    organizationId: trigger.organizationId ?? undefined,
    siteId: trigger.siteId ?? undefined,
    compoundId: trigger.compoundId ?? undefined,
    cellId: trigger.cellId ?? undefined,
    commodityTypeId: trigger.commodityTypeId ?? '',
    commodityType: trigger.commodityType
        ? {
            id: trigger.commodityType.id,
            name: trigger.commodityType.name,
        }
        : undefined,
    conditionLogic: trigger.conditionLogic ?? 'AND',
    conditions: Array.isArray(trigger.conditions)
        ? trigger.conditions.map(mapConditionFromApi)
        : [],
    actions: Array.isArray(trigger.actions) ? trigger.actions.map(mapActionFromApi) : [],
    severity: trigger.severity ?? 'MEDIUM',
    isActive: trigger.isActive ?? true,
});

const mapConditionToApi = (condition: Condition) => ({
    id: condition.id,
    metric: condition.metric,
    type: condition.type,
    operator: condition.operator,
    value: condition.value,
    secondaryValue: condition.secondaryValue,
    changeDirection: condition.changeDirection,
    changeAmount: condition.changeAmount,
    timeWindowHours: condition.timeWindowHours,
    valueSources: condition.valueSources,
    sourceType: condition.sourceType,
});

const mapActionToApi = (action: Action) => ({
    type: action.type,
    template: action.template,
    webhookUrl: action.webhookUrl,
    recipients: action.recipients,
});

const mapTriggerToApi = (trigger: Trigger) => ({
    name: trigger.name,
    description: trigger.description || undefined,
    scopeType: trigger.scopeType,
    organizationId: trigger.organizationId,
    siteId: trigger.siteId,
    compoundId: trigger.compoundId,
    cellId: trigger.cellId,
    commodityTypeId: trigger.commodityTypeId,
    conditionLogic: trigger.conditionLogic,
    conditions: trigger.conditions.map(mapConditionToApi),
    actions: trigger.actions.map(mapActionToApi),
    severity: trigger.severity,
    isActive: trigger.isActive,
});

export function useTriggerApi() {
    const { get, post, patch, del } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getList = useCallback(
        async (params?: any) => {
            setIsLoading(true);
            try {
                const response = await get<PaginatedResponse<ApiTriggerResponse>>(basePath, params);
                if (response.data) {
                    return {
                        ...response,
                        data: {
                            ...response.data,
                            items: (response.data.items ?? []).map(mapTriggerFromApi),
                        },
                    };
                }
                return response;
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const getById = useCallback(
        async (id: string) => {
            setIsLoading(true);
            try {
                const response = await get<ApiTriggerResponse>(`${basePath}/${id}`);
                return response.data
                    ? { ...response, data: mapTriggerFromApi(response.data) }
                    : response;
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const create = useCallback(
        async (data: Trigger) => {
            setIsCreating(true);
            try {
                const response = await post<ApiTriggerResponse>(basePath, mapTriggerToApi(data));
                return response.data
                    ? { ...response, data: mapTriggerFromApi(response.data) }
                    : response;
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const update = useCallback(
        async (id: string, data: Trigger) => {
            setIsUpdating(true);
            try {
                const response = await patch<ApiTriggerResponse>(`${basePath}/${id}`, mapTriggerToApi(data));
                return response.data
                    ? { ...response, data: mapTriggerFromApi(response.data) }
                    : response;
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const toggleActive = useCallback(
        async (id: string, isActive: boolean) => {
            setIsUpdating(true);
            try {
                const response = await patch<ApiTriggerResponse>(`${basePath}/${id}/toggle`, { isActive });
                return response.data
                    ? { ...response, data: mapTriggerFromApi(response.data) }
                    : response;
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const remove = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del<void>(`${basePath}/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    return {
        getList,
        getById,
        create,
        update,
        toggleActive,
        remove,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    };
}
