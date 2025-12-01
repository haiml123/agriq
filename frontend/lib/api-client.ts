const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

type Params = Record<string, string | number | boolean | undefined>;

type ApiResponse<T> = {
    data: T | null;
    error: string | null;
    status: number;
};

function buildUrl(endpoint: string, params?: Params): string {
    let url = `${API_URL}${endpoint}`;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const query = searchParams.toString();
        if (query) url += `?${query}`;
    }

    return url;
}

export async function apiGet<T>(
    endpoint: string,
    token?: string,
    params?: Params
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(buildUrl(endpoint, params), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                data: null,
                error: errorData.message || `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}

export async function apiPost<T>(
    endpoint: string,
    body: unknown,
    token?: string,
    params?: Params
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(buildUrl(endpoint, params), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                data: null,
                error: errorData.message || `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}

export async function apiPatch<T>(
    endpoint: string,
    body: unknown,
    token?: string,
    params?: Params
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(buildUrl(endpoint, params), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                data: null,
                error: errorData.message || `Request failed with status ${response.status}`,
                status: response.status,
            };
        }

        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}
