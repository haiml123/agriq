'use client';

import { useCallback, useState } from 'react';
import { useApi } from './use-api';
import {
    CreateGatewayDto,
    CreateSensorDto,
    CreateSensorReadingsBatchDto,
    Gateway,
    Sensor,
    SensorReading,
    TransferSensorDto,
    UpdateGatewayDto,
} from '@/schemas/sites.schema';

export function useGatewayApi() {
    const { get, post, patch, del } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ============ SENSORS (SIMULATOR) ============

    const getSensors = useCallback(
        async (params?: { gatewayId?: string; cellId?: string }) => {
            setIsLoading(true);
            try {
                return await get<Sensor[]>('/gateways/simulator/sensors', params);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const createSensor = useCallback(
        async (data: CreateSensorDto) => {
            setIsCreating(true);
            try {
                return await post<Sensor>('/gateways/simulator/sensors', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const transferSensor = useCallback(
        async (id: string, data: TransferSensorDto) => {
            setIsUpdating(true);
            try {
                return await patch<Sensor>(`/gateways/simulator/sensors/${id}/transfer`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const createSensorReadingsBatch = useCallback(
        async (id: string, data: CreateSensorReadingsBatchDto) => {
            setIsCreating(true);
            try {
                return await post<{ count: number }>(`/gateways/simulator/sensors/${id}/readings/batch`, data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const getSensorReadings = useCallback(
        async (id: string, params?: { limit?: number }) => {
            setIsLoading(true);
            try {
                return await get<SensorReading[]>(`/gateways/simulator/sensors/${id}/readings`, params);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    // ============ GATEWAYS ============

    const getGateways = useCallback(
        async (params?: { cellId?: string; organizationId?: string; unpaired?: boolean }) => {
            setIsLoading(true);
            try {
                return await get<Gateway[]>('/gateways', params);
            } finally {
                setIsLoading(false);
            }
        },
        [get]
    );

    const createGateway = useCallback(
        async (data: CreateGatewayDto) => {
            setIsCreating(true);
            try {
                return await post<Gateway>('/gateways', data);
            } finally {
                setIsCreating(false);
            }
        },
        [post]
    );

    const updateGateway = useCallback(
        async (id: string, data: UpdateGatewayDto) => {
            setIsUpdating(true);
            try {
                return await patch<Gateway>(`/gateways/${id}`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [patch]
    );

    const deleteGateway = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            try {
                return await del(`/gateways/${id}`);
            } finally {
                setIsDeleting(false);
            }
        },
        [del]
    );

    const registerGateway = useCallback(
        async (data: { externalId: string; organizationId?: string }) => {
            setIsUpdating(true);
            try {
                return await post<Gateway>('/gateways/register', data);
            } finally {
                setIsUpdating(false);
            }
        },
        [post]
    );

    const assignGatewayToCell = useCallback(
        async (id: string, data: { cellId: string }) => {
            setIsUpdating(true);
            try {
                return await post<Gateway>(`/gateways/${id}/assign`, data);
            } finally {
                setIsUpdating(false);
            }
        },
        [post]
    );

    const unpairGateway = useCallback(
        async (id: string) => {
            setIsUpdating(true);
            try {
                return await post<Gateway>(`/gateways/${id}/unpair`, {});
            } finally {
                setIsUpdating(false);
            }
        },
        [post]
    );

    return {
        getSensors,
        createSensor,
        transferSensor,
        createSensorReadingsBatch,
        getSensorReadings,
        getGateways,
        createGateway,
        updateGateway,
        deleteGateway,
        registerGateway,
        assignGatewayToCell,
        unpairGateway,
        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
    };
}
