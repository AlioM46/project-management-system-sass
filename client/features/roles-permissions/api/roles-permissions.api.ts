import { apiClient } from "@/shared/api/apiClient";
import { Permission, Role, CreateRoleInput, UpdateRoleInput } from "../types";

export async function getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<{ permissions: Permission[] }>("/roles-permissions/permissions");
    return response.permissions;
}

export async function getWorkspaceRoles(): Promise<Role[]> {
    const response = await apiClient.get<{ roles: Role[] }>("/roles-permissions/roles");
    return response.roles;
}

export async function createWorkspaceRole(data: CreateRoleInput): Promise<Role> {
    const response = await apiClient.post<{ role: Role }>("/roles-permissions/roles", data);
    return response.role;
}

export async function updateWorkspaceRole(roleId: number, data: UpdateRoleInput): Promise<Role> {
    const response = await apiClient.patch<{ role: Role }>(`/roles-permissions/roles/${roleId}`, data);
    return response.role;
}

export async function deleteWorkspaceRole(roleId: number): Promise<void> {
    await apiClient.delete(`/roles-permissions/roles/${roleId}`);
}

export async function updateWorkspaceRolePermissions(roleId: number, permissions: string[]): Promise<Role> {
    const response = await apiClient.put<{ role: Role }>(`/roles-permissions/roles/${roleId}/permissions`, {
        permissions,
    });
    return response.role;
}

export async function syncDefaultRoles(): Promise<Role[]> {
    const response = await apiClient.post<{ roles: Role[] }>("/roles-permissions/defaults/sync");
    return response.roles;
}
