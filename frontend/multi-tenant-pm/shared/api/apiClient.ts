// src/shared/api/apiClient.ts

import { getCookie, removeCookie, setCookie } from "@/shared/utils/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiOptions = RequestInit & {
    workspace?: boolean;
    skipRefresh?: boolean;
};

async function refreshAccessToken() {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
    });

    if (!response.ok) {
        removeCookie("access_token");
        removeCookie("workspace_id");

        window.location.href = "/login";

        throw new Error("Session expired");
    }

    const data = await response.json();

    setCookie("access_token", data.access_token);

    return data.access_token;
}

async function request(
    path: string,
    options: ApiOptions = {},
    retry = true
) {
    const {
        workspace = true,
        skipRefresh = false,
        headers,
        ...fetchOptions
    } = options;

    const accessToken = getCookie("access_token");
    const workspaceId = getCookie("workspace_id");

    const response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",

            ...(accessToken && {
                Authorization: `Bearer ${accessToken}`,
            }),

            ...(workspace &&
                workspaceId && {
                "X-Workspace-Id": workspaceId,
            }),

            ...headers,
        },
    });

    if (response.status === 401 && retry && !skipRefresh) {
        await refreshAccessToken();

        return request(path, options, false);
    }

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw error || new Error("API request failed");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export const apiClient = {
    get(path: string, options?: ApiOptions) {
        return request(path, {
            ...options,
            method: "GET",
        });
    },

    post(path: string, body?: unknown, options?: ApiOptions) {
        return request(path, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    put(path: string, body?: unknown, options?: ApiOptions) {
        return request(path, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    patch(path: string, body?: unknown, options?: ApiOptions) {
        return request(path, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    delete(path: string, options?: ApiOptions) {
        return request(path, {
            ...options,
            method: "DELETE",
        });
    },
};