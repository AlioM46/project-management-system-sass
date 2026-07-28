import { ApiErrorResponse, ApiSuccessResponse } from "../types/apiResponse"
import { deleteCookie, getCookie, setCookie } from "../utils/cookies";
import ApiError from "./ApiError";


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


interface ApiOptions extends RequestInit {
    workspace?: boolean
    skipRefresh?: boolean
}

// return boolean
function isFormDataBody(body: unknown): body is FormData {
    return typeof FormData !== "undefined" && body instanceof FormData;
}


async function refreshAccessToken() {

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
        credentials: "include",
        method: "POST"
    })

    if (!response.ok) {
        deleteCookie("access_token");
        deleteCookie("workspace_id");
        window.location.href = "/login";
        throw new ApiError("session expired", "SESSION_EXPIRED", 401, {});
    }

    const data = await response.json();
    setCookie("access_token", data.access_token);


}


async function _request<T>(path: string, options: ApiOptions, retry: boolean = true): Promise<ApiSuccessResponse<T>> {



    const {
        workspace = true,
        skipRefresh = false,
        headers,
        ...fetchOptions // any other data we did not use
    } = options


    const hasFormDataBody = isFormDataBody(fetchOptions.body);
    const accessToken = getCookie("access_token");
    const workspaceId = getCookie("workspace_id");


    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...fetchOptions,
        headers: {
            ...(!hasFormDataBody && {
                'Content-Type': 'application/json'
            }),
            ...(accessToken && {
                'Authorization': `Bearer ${accessToken}`,
            }),
            ...(workspace && workspaceId && {
                'X-Workspace-Id': workspaceId,
            }),
            ...headers,
        }
    })




    if (response.status === 204) {
        return {
            success: true,
            message: "operation successfully completed",
            data: null as T,
            meta: {}
        } as ApiSuccessResponse<T>;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {

        if (response.status === 401 && !skipRefresh && retry) {
            await refreshAccessToken();
            return _request<T>(path, options, false);
        }


        const errorDate = result as ApiErrorResponse;
        throw new ApiError(
            errorDate?.error?.message || "API Request failed",
            errorDate?.error?.code || "SERVER_ERROR",
            response?.status,
            errorDate?.error?.meta || {}

        )





    }

    return result as ApiSuccessResponse<T>

}


export const apiClient = {
    async get<T>(path: string, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "GET" });
        return response.data;
    },
    async post<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "POST", body: body ? (isFormDataBody(body) ? body : JSON.stringify(body)) : undefined })
        return response.data;
    },
    async put<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "PUT", body: body ? (isFormDataBody(body) ? body : JSON.stringify(body)) : undefined });
        return response.data;
    },
    async patch<T>(path: string, body?: unknown, options?: ApiOptions) {
        const response = await _request<T>(path, {
            ...options,
            method: "PATCH",
            body: body ? (isFormDataBody(body) ? body : JSON.stringify(body)) : undefined,
        });
        return response.data;
    },

    async delete<T>(path: string, options?: ApiOptions) {
        const response = await _request<T>(path, { ...options, method: "DELETE" });
        return response.data;
    },

    // async getPaginated<T>(path: string, options?: ApiOptions) {
    //     return await _request<T>(path, { ...options, method: "GET" });
    // },
}
