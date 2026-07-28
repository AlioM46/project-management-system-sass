import { apiClient } from "@/shared/api/apiClient";
import { AuditLog, WorkspaceSettings } from "../types";

export interface AuditLogFilters {
    target_id?: string;
    target_type?: string;
    actor_user_id?: string;
    event_type?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

export interface PaginatedAuditLogsResponse {
    data: AuditLog[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedAuditLogsResponse> {
    const params = new URLSearchParams();
    if (filters?.target_id) params.append("target_id", filters.target_id);
    if (filters?.target_type) params.append("target_type", filters.target_type);
    if (filters?.actor_user_id) params.append("actor_user_id", filters.actor_user_id);
    if (filters?.event_type) params.append("event_type", filters.event_type);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.per_page) params.append("per_page", filters.per_page.toString());

    const queryString = params.toString();
    const url = `/audit-logs${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.getPaginated<any>(url);
    
    const payload = response.data || {};
    const meta = response.meta?.pagination || {};

    const rawLogs = payload.audit_logs || (Array.isArray(payload) ? payload : []);

    return {
        data: Array.isArray(rawLogs) ? rawLogs : [],
        current_page: meta.current_page || 1,
        last_page: meta.last_page || 1,
        total: meta.total || rawLogs.length || 0,
        per_page: meta.per_page || 30,
    };
}

import { getCookie } from "@/shared/utils/cookies";

export async function exportAuditLogs(filters?: AuditLogFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.target_id) params.append("target_id", filters.target_id);
    if (filters?.target_type) params.append("target_type", filters.target_type);
    if (filters?.actor_user_id) params.append("actor_user_id", filters.actor_user_id);
    if (filters?.event_type) params.append("event_type", filters.event_type);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);

    const queryString = params.toString();
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    const exportUrl = `${apiUrl}/audit-logs/export${queryString ? `?${queryString}` : ""}`;

    const accessToken = getCookie("access_token");
    const workspaceId = getCookie("workspace_id");

    const response = await fetch(exportUrl, {
        method: "GET",
        credentials: "include",
        headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            ...(workspaceId && { "X-Workspace-Id": workspaceId }),
        },
    });

    if (!response.ok) {
        throw new Error("Failed to download CSV export.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function updateWorkspaceSettings(data: WorkspaceSettings): Promise<void> {
    await apiClient.patch("/workspaces/current", data);
}

export async function leaveWorkspace(): Promise<void> {
    await apiClient.post("/workspaces/current/leave");
}

export async function deleteWorkspace(): Promise<void> {
    await apiClient.delete("/workspaces/current");
}
