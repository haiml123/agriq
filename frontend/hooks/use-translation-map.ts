'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/app-provider';

export function useTranslationMap(entity: string, _locale?: string) {
    const { translateEntity } = useApp();

    return useMemo(() => {
        return (id: string, field: string, fallback?: string) =>
            translateEntity(entity, id, field, fallback);
    }, [entity, translateEntity]);
}
