import { apiClient } from "@/shared/api/apiClient";
import { AuditLog, AuditLogFilters, WorkspaceSettings } from "../types";
import { ApiSuccessResponse } from "@/shared/types/apiResponse";
import { getCookie } from "@/shared/utils/cookies";

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<{ audit_logs: AuditLog[]; count: number; pagination?: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const path = params.toString() ? `/audit-logs?${params.toString()}` : "/audit-logs";
    const response = await apiClient.getPaginated<{ audit_logs: AuditLog[]; count: number }>(path) as ApiSuccessResponse<{ audit_logs: AuditLog[]; count: number }>;

    return {
        ...response.data,
        pagination: response.meta?.pagination,
    };
}

export async function exportAuditLogs(filters: AuditLogFilters = {}): Promise<void> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const accessToken = getCookie("access_token");
    const workspaceId = getCookie("workspace_id");
    const locale = getCookie("locale") || "en";
    const path = params.toString() ? `/audit-logs/export?${params.toString()}` : "/audit-logs/export";

    const response = await fetch(`${apiUrl}${path}`, {
        method: "GET",
        credentials: "include",
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
            "X-Locale": locale,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to export audit logs");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition");
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] || "audit-logs.csv";
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
}

export async function updateWorkspaceSettings(data: WorkspaceSettings): Promise<void> {
    await apiClient.patch("/workspaces/current", data);
}

export async function deleteWorkspace(): Promise<void> {
    await apiClient.delete("/workspaces/current");
}
