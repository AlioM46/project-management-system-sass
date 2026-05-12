// src/shared/api/apiClient.ts

import { getCookie, removeCookie, setCookie } from "@/shared/utils/cookies";
import { ApiError } from "./ApiError";
import { ApiSuccessResponse, ApiErrorResponse } from "../types/apiResponse";

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

/**
 * This is our internal core function.
 * It handles the technical details: headers, tokens, and errors.
 * It ALWAYS returns the full backend object (success, message, data, meta).
 */
async function _request<T>(
    path: string,
    options: ApiOptions = {},
    retry = true
): Promise<ApiSuccessResponse<T>> {
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

    // 1. Try to parse the response as JSON
    const result = await response.json().catch(() => null);

    // 2. Handle HTTP Errors (400, 401, 500, etc.)
    if (!response.ok) {
        // If it's a 401 and we haven't retried yet, try to refresh the token
        if (response.status === 401 && retry && !skipRefresh) {
            await refreshAccessToken();
            return _request<T>(path, options, false);
        }

        // Otherwise, throw our custom ApiError with backend details

        // note: apiError is class that is used to throw error ( not interface )
        // apiErrorRespones is just interface to describe the structure of the error response from the backend
        // later on, we can customize the apiError class, like adding more methods or properties
        // so we can catch it and handle it in a better way

        const errorData = result as ApiErrorResponse;
        throw new ApiError(
            errorData?.error?.message || "API request failed",
            errorData?.error?.code || "SERVER_ERROR",
            response.status,
            errorData?.error?.meta || {}
        );
    }

    // 3. Handle Empty Success (204 No Content)
    if (response.status === 204) {

        return { success: true, message: "operation successfully completed", data: null as T, meta: {} } as ApiSuccessResponse<T>;
    }

    /**
     * 4. Handle Success! 
     * We return the WHOLE object to the caller.
     */
    return result as ApiSuccessResponse<T>;
}

export const apiClient = {
    async get<T>(path: string, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "GET" });
        return response.data;
    },

    async post<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
        return response.data;
    },

    async put<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
        return response.data;
    },

    async patch<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
        return response.data;
    },

    async delete<T>(path: string, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "DELETE" });
        return response.data;
    },

    async getPaginated<T>(path: string, options?: ApiOptions) {
        return await _request<T>(path, { ...options, method: "GET" });
    },
};