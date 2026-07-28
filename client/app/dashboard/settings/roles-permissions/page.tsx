"use client";

import React, { useState } from "react";
import { Plus, RefreshCw, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRolesPermissions } from "@/features/roles-permissions/hooks/useRolesPermissions";
import { RoleCard } from "@/features/roles-permissions/components/RoleCard";
import { CreateRoleDialog } from "@/features/roles-permissions/components/CreateRoleDialog";
import { DeleteRoleDialog } from "@/features/roles-permissions/components/DeleteRoleDialog";
import { Role } from "@/features/roles-permissions/types";

export default function RolesPermissionsPage() {
    const {
        roles,
        groupedPermissions,
        isLoading,
        error,
        canCreateRole,
        canUpdateRole,
        canDeleteRole,
        canAssignRole,
        refresh,
        createRole,
        updateRole,
        deleteRole,
        updatePermissions,
        syncDefaults,
    } = useRolesPermissions();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncDefaultsClick = async () => {
        setIsSyncing(true);
        await syncDefaults();
        setIsSyncing(false);
    };

    return (
        <div className="space-y-8">
            {/* Sub-page Header & Main Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Roles & Permissions
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Configure workspace access control, system roles, and custom role permission matrices.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSyncDefaultsClick}
                        disabled={isLoading || isSyncing}
                        className="rounded-xl text-xs border-zinc-200 dark:border-white/10"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                        Sync Defaults
                    </Button>

                    {canCreateRole && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Role
                        </Button>
                    )}
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Roles List */}
            {isLoading ? (
                <div className="p-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading workspace roles & permission matrix...
                </div>
            ) : roles.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 space-y-3">
                    <Shield className="h-10 w-10 text-zinc-400 mx-auto" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        No roles found in this workspace.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSyncDefaultsClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium"
                    >
                        Provision Default System Roles
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {roles.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            groupedPermissions={groupedPermissions}
                            canUpdate={canUpdateRole}
                            canDelete={canDeleteRole}
                            canAssign={canAssignRole}
                            onUpdateRole={updateRole}
                            onDeleteRole={setRoleToDelete}
                            onSavePermissions={updatePermissions}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <CreateRoleDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={createRole}
            />

            <DeleteRoleDialog
                role={roleToDelete}
                onOpenChange={(open) => !open && setRoleToDelete(null)}
                onDelete={deleteRole}
            />
        </div>
    );
}
