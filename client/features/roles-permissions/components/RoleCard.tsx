"use client";

import React, { useState } from "react";
import {
    Shield,
    Lock,
    Users,
    ChevronDown,
    ChevronUp,
    Edit2,
    Trash2,
    Check,
    X,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Role, GroupedPermissions, UpdateRoleInput } from "../types";
import { PermissionMatrix } from "./PermissionMatrix";

interface RoleCardProps {
    role: Role;
    groupedPermissions: GroupedPermissions[];
    canUpdate: boolean;
    canDelete: boolean;
    canAssign: boolean;
    onUpdateRole: (roleId: number, data: UpdateRoleInput) => Promise<boolean>;
    onDeleteRole: (role: Role) => void;
    onSavePermissions: (roleId: number, permissionKeys: string[]) => Promise<boolean>;
}

export function RoleCard({
    role,
    groupedPermissions,
    canUpdate,
    canDelete,
    canAssign,
    onUpdateRole,
    onDeleteRole,
    onSavePermissions,
}: RoleCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(role.name);
    const [description, setDescription] = useState(role.description || "");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const isSystem = role.is_system;
    const isEditable = !isSystem && canUpdate && role.is_editable;
    const isDeletable = !isSystem && canDelete && role.is_deletable;

    const initialPermKeys = (role.permissions || []).map((p) => p.key);

    const handleSaveEdit = async () => {
        if (!name.trim()) return;
        setIsSavingEdit(true);
        const success = await onUpdateRole(role.id, {
            name: name.trim(),
            description: description.trim() || undefined,
        });
        setIsSavingEdit(false);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setName(role.name);
        setDescription(role.description || "");
        setIsEditing(false);
    };

    return (
        <div
            className={`bg-white dark:bg-[#0a0a0a] rounded-2xl border transition-all shadow-sm overflow-hidden ${
                isExpanded
                    ? "border-blue-500/40 dark:border-blue-500/30 ring-1 ring-blue-500/20"
                    : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
            }`}
        >
            {/* Card Main Info Bar */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSystem
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                    >
                        {isSystem ? <Lock className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-2 max-w-md pt-1">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Add description..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-600 dark:text-zinc-400"
                                />
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        disabled={isSavingEdit || !name.trim()}
                                        className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                                    >
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Save
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingEdit}
                                        className="h-7 px-2.5 rounded-lg text-xs"
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                                        {role.name}
                                    </h4>

                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                                        {role.slug}
                                    </span>

                                    {isSystem ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                            <Lock className="h-3 w-3" />
                                            System Constant
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            <Sparkles className="h-3 w-3" />
                                            Custom Role
                                        </span>
                                    )}

                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                                        <Users className="h-3 w-3" />
                                        {role.member_count} member{role.member_count === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {role.description && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                        {role.description}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Controls & Expand Button */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isEditable && !isEditing && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="rounded-xl text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        >
                            <Edit2 className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                    )}

                    {isDeletable && !isEditing && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRole(role)}
                            className="rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-xl text-xs gap-1 border-zinc-200 dark:border-white/10"
                    >
                        <span>{initialPermKeys.length} Permissions</span>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Collapsible Permission Matrix */}
            {isExpanded && (
                <div className="px-5 pb-5">
                    <PermissionMatrix
                        roleId={role.id}
                        roleName={role.name}
                        isSystem={isSystem}
                        initialPermissionKeys={initialPermKeys}
                        groupedPermissions={groupedPermissions}
                        canAssign={canAssign}
                        onSave={onSavePermissions}
                    />
                </div>
            )}
        </div>
    );
}
