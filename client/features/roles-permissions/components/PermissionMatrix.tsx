"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Check, Save, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupedPermissions, Permission } from "../types";

interface PermissionMatrixProps {
    roleId: number;
    roleName: string;
    isSystem: boolean;
    initialPermissionKeys: string[];
    groupedPermissions: GroupedPermissions[];
    canAssign: boolean;
    onSave: (roleId: number, permissionKeys: string[]) => Promise<boolean>;
}

export function PermissionMatrix({
    roleId,
    roleName,
    isSystem,
    initialPermissionKeys,
    groupedPermissions,
    canAssign,
    onSave,
}: PermissionMatrixProps) {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(initialPermissionKeys);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Keep internal state in sync if parent props change
    useEffect(() => {
        setSelectedKeys(initialPermissionKeys);
    }, [initialPermissionKeys]);

    const initialSet = useMemo(() => new Set(initialPermissionKeys), [initialPermissionKeys]);
    const currentSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

    // Check if permissions have been modified
    const isDirty = useMemo(() => {
        if (initialSet.size !== currentSet.size) return true;
        for (const key of currentSet) {
            if (!initialSet.has(key)) return true;
        }
        return false;
    }, [initialSet, currentSet]);

    const handleToggleKey = (key: string) => {
        if (isSystem || !canAssign) return;

        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return Array.from(next);
        });
    };

    const handleSelectAllGroup = (perms: Permission[]) => {
        if (isSystem || !canAssign) return;

        const groupKeys = perms.map((p) => p.key);
        const allSelected = groupKeys.every((k) => currentSet.has(k));

        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (allSelected) {
                groupKeys.forEach((k) => next.delete(k));
            } else {
                groupKeys.forEach((k) => next.add(k));
            }
            return Array.from(next);
        });
    };

    const handleReset = () => {
        setSelectedKeys(initialPermissionKeys);
    };

    const handleSave = async () => {
        if (isSystem || !canAssign || !isDirty) return;
        setIsSaving(true);
        const success = await onSave(roleId, selectedKeys);
        setIsSaving(false);
    };

    // Filter permissions based on search query
    const filteredGroupedPermissions = useMemo(() => {
        if (!searchQuery.trim()) return groupedPermissions;

        const query = searchQuery.toLowerCase();
        return groupedPermissions
            .map((group) => {
                const matchingPerms = group.permissions.filter(
                    (p) =>
                        p.name.toLowerCase().includes(query) ||
                        p.key.toLowerCase().includes(query) ||
                        (p.description && p.description.toLowerCase().includes(query))
                );
                return {
                    ...group,
                    permissions: matchingPerms,
                };
            })
            .filter((group) => group.permissions.length > 0);
    }, [groupedPermissions, searchQuery]);

    const isReadOnly = isSystem || !canAssign;

    return (
        <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-white/10">
            {/* Header controls: Search & Save Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                    />
                </div>

                {!isReadOnly && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isDirty && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={isSaving}
                                className="rounded-xl text-xs text-zinc-600 dark:text-zinc-400"
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Reset
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs shadow-sm font-medium"
                        >
                            {isSaving ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5 mr-1" />
                                    Save Permissions {isDirty && `(${selectedKeys.length})`}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Read-only notification banner if applicable */}
            {isSystem && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>This is a built-in system role ({roleName}). System role permissions are fixed constants and cannot be modified.</span>
                </div>
            )}

            {!isSystem && !canAssign && (
                <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>You are viewing permissions in read-only mode because your role does not have permission to assign role permissions.</span>
                </div>
            )}

            {/* Grouped Permissions Grid */}
            <div className="space-y-6">
                {filteredGroupedPermissions.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        No permissions match your search query &quot;{searchQuery}&quot;.
                    </div>
                ) : (
                    filteredGroupedPermissions.map((group) => {
                        const groupKeys = group.permissions.map((p) => p.key);
                        const selectedInGroupCount = groupKeys.filter((k) => currentSet.has(k)).length;
                        const isAllGroupSelected = selectedInGroupCount === groupKeys.length;

                        return (
                            <div key={group.resource} className="bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-3">
                                {/* Group Header */}
                                <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                                            {group.label}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-medium">
                                            {selectedInGroupCount} / {group.permissions.length}
                                        </span>
                                    </div>

                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllGroup(group.permissions)}
                                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {isAllGroupSelected ? "Deselect Group" : "Select Group"}
                                        </button>
                                    )}
                                </div>

                                {/* Permissions List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                                    {group.permissions.map((perm) => {
                                        const isChecked = currentSet.has(perm.key);

                                        return (
                                            <label
                                                key={perm.key}
                                                onClick={() => handleToggleKey(perm.key)}
                                                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${isChecked
                                                        ? "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-300"
                                                        : "bg-white dark:bg-[#080808] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20"
                                                    } ${isReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
                                            >
                                                <div
                                                    className={`mt-0.5 h-4 w-4 rounded shrink-0 flex items-center justify-center border transition-colors ${isChecked
                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                            : "border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-white/5"
                                                        }`}
                                                >
                                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                                </div>
                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    <span className="font-medium text-xs leading-snug truncate">
                                                        {perm.name}
                                                    </span>
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                                                        {perm.key}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
