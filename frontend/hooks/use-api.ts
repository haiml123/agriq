'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';

type Params = Record<string, string | number | boolean | undefined>;

export function useApi() {
    const { data: session } = useSession();
    const token = session?.accessToken;

    const get = useCallback(
        <T>(endpoint: string, params?: Params) =>
            apiGet<T>(endpoint, token, params),
        [token]
    );

    const post = useCallback(
        <T>(endpoint: string, body: unknown, params?: Params) =>
            apiPost<T>(endpoint, body, token, params),
        [token]
    );

    const patch = useCallback(
        <T>(endpoint: string, body: unknown, params?: Params) =>
            apiPatch<T>(endpoint, body, token, params),
        [token]
    );

    return { get, post, patch };
}
