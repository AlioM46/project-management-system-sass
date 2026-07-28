"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { getMe } from "@/features/auth/api/auth.api";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import {
    getPermissions,
    getWorkspaceRoles,
    createWorkspaceRole,
    updateWorkspaceRole,
    deleteWorkspaceRole,
    updateWorkspaceRolePermissions,
    syncDefaultRoles,
} from "../api/roles-permissions.api";
import { Permission, Role, CreateRoleInput, UpdateRoleInput, GroupedPermissions } from "../types";

const RESOURCE_LABELS: Record<string, string> = {
    workspace: "Workspace",
    member: "Members",
    role: "Roles & Permissions",
    project: "Projects",
    task: "Tasks",
    comment: "Comments",
    audit: "Audit Logs",
    report: "Reports",
};

export function useRolesPermissions() {
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMember, setCurrentMember] = useState<Member | null>(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
    const [isOwner, setIsOwner] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [permsData, rolesData, currentUser, membersRes] = await Promise.all([
                getPermissions(),
                getWorkspaceRoles(),
                getMe(),
                getMembers(),
            ]);

            setAllPermissions(permsData);
            setRoles(rolesData);

            const membersList = membersRes.members || [];
            const memberObj = membersList.find((m: Member) => String(m.user_id) === String(currentUser.id));

            if (memberObj) {
                setCurrentMember(memberObj);
                const roleSlug = memberObj.role?.slug?.toLowerCase() || memberObj.role?.name?.toLowerCase() || "";
                setIsOwner(roleSlug === "owner");

                // Get permission keys for user's role
                const userRoleObj = rolesData.find((r) => r.id === Number(memberObj.role?.id));
                const userPermKeys = userRoleObj?.permissions?.map((p) => p.key) || [];
                setCurrentUserPermissions(userPermKeys);
            }
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to load roles and permissions." : "Failed to load roles and permissions.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Group permissions by resource prefix (e.g., "task.create" -> resource "task")
    const groupedPermissions = useMemo<GroupedPermissions[]>(() => {
        const groups: Record<string, Permission[]> = {};

        allPermissions.forEach((perm) => {
            const resource = perm.key.split(".")[0] || "other";
            if (!groups[resource]) {
                groups[resource] = [];
            }
            groups[resource].push(perm);
        });
        //  Resource    Perms   
        // ["users", [ { key: "users.read" }, { key: "users.write" } ]]
        return Object.entries(groups).map(([resource, perms]) => ({
            resource,
            label: RESOURCE_LABELS[resource] || resource.charAt(0).toUpperCase() + resource.slice(1),
            permissions: perms,
        }));
    }, [allPermissions]);

    // Permissions check helpers (Owner bypasses all UI permission gates)
    const canCreateRole = isOwner || currentUserPermissions.includes("role.create");
    const canUpdateRole = isOwner || currentUserPermissions.includes("role.update");
    const canDeleteRole = isOwner || currentUserPermissions.includes("role.delete");
    const canAssignRole = isOwner || currentUserPermissions.includes("role.assign");

    const handleCreateRole = async (data: CreateRoleInput): Promise<boolean> => {
        try {
            const newRole = await createWorkspaceRole(data);
            toast.success(`Role "${newRole.name}" created successfully.`);
            await fetchData();
            return true;
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to create role." : "Failed to create role.";
            toast.error(msg);
            return false;
        }
    };

    const handleUpdateRole = async (roleId: number, data: UpdateRoleInput): Promise<boolean> => {
        try {
            const updated = await updateWorkspaceRole(roleId, data);
            toast.success(`Role "${updated.name}" updated successfully.`);
            await fetchData();
            return true;
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to update role." : "Failed to update role.";
            toast.error(msg);
            return false;
        }
    };

    const handleDeleteRole = async (roleId: number): Promise<boolean> => {
        try {
            await deleteWorkspaceRole(roleId);
            toast.success("Role deleted successfully.");
            await fetchData();
            return true;
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to delete role." : "Failed to delete role.";
            toast.error(msg);
            return false;
        }
    };

    const handleUpdatePermissions = async (roleId: number, permissionKeys: string[]): Promise<boolean> => {
        try {
            await updateWorkspaceRolePermissions(roleId, permissionKeys);
            toast.success("Role permissions updated successfully.");
            await fetchData();
            return true;
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to update permissions." : "Failed to update permissions.";
            toast.error(msg);
            return false;
        }
    };

    const handleSyncDefaults = async (): Promise<boolean> => {
        try {
            await syncDefaultRoles();
            toast.success("Default roles synchronized.");
            await fetchData();
            return true;
        } catch (err) {
            const msg = err instanceof ApiError ? err.getFriendlyMessage() ?? "Failed to sync default roles." : "Failed to sync default roles.";
            toast.error(msg);
            return false;
        }
    };

    return {
        allPermissions,
        groupedPermissions,
        roles,
        isLoading,
        error,
        currentMember,
        isOwner,
        canCreateRole,
        canUpdateRole,
        canDeleteRole,
        canAssignRole,
        refresh: fetchData,
        createRole: handleCreateRole,
        updateRole: handleUpdateRole,
        deleteRole: handleDeleteRole,
        updatePermissions: handleUpdatePermissions,
        syncDefaults: handleSyncDefaults,
    };
}
