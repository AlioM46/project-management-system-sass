import { apiClient } from "@/shared/api/apiClient";
import { AuditLog, WorkspaceSettings } from "../types";

export async function getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    const response = await apiClient.get<{ logs: AuditLog[] }>("/audit-logs");
    return response;
}

export async function updateWorkspaceSettings(data: WorkspaceSettings): Promise<void> {
    await apiClient.patch("/workspaces/current", data);
}

export async function deleteWorkspace(): Promise<void> {
    await apiClient.delete("/workspaces/current");
}
