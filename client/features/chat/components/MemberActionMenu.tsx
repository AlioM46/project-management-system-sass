"use client";

import { X, UserX, ShieldCheck, ShieldAlert, Crown, Loader2 } from "lucide-react";
import { getInitials } from "../utils/chatHelpers";

interface MemberActionMenuProps {
    isOpen: boolean;
    targetMember: {
        id: number;
        user_id: number;
        role: "owner" | "admin" | "member";
        user: {
            id: number;
            name: string;
            email: string;
            avatar_url: string | null;
        };
    } | null;
    currentUserRole: "owner" | "admin" | "member";
    currentUserId: number;
    isRemoving: boolean;
    isUpdatingRole?: boolean;
    onRemoveMember: (userId: number) => void;
    onUpdateRole: (userId: number, newRole: "owner" | "admin" | "member") => void;
    onClose: () => void;
}

export function MemberActionMenu({
    isOpen,
    targetMember,
    currentUserRole,
    currentUserId,
    isRemoving,
    isUpdatingRole = false,
    onRemoveMember,
    onUpdateRole,
    onClose,
}: MemberActionMenuProps) {
    if (!isOpen || !targetMember) return null;

    const isSelf = targetMember.user_id === currentUserId;

    // Role Permission Matrix for Removing
    const canRemove = (() => {
        if (isSelf) return false; // Cannot remove self via member options
        if (currentUserRole === "owner") return true; // Owner can remove anyone
        if (currentUserRole === "admin") {
            // Admin can remove regular members, but NOT owner or other admins
            return targetMember.role === "member";
        }
        return false; // Regular member cannot remove anyone
    })();

    // Role Management Permissions
    const canManageRoles = !isSelf && currentUserRole !== "member";
    const canMakeAdmin = canManageRoles && targetMember.role === "member";
    const canDismissAdmin = canManageRoles && targetMember.role === "admin" && (currentUserRole === "owner" || currentUserRole === "admin");
    const canMakeOwner = !isSelf && currentUserRole === "owner";

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                        Member Options
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Member Profile Summary */}
                <div className="p-4 flex items-center gap-3 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {getInitials(targetMember.user?.name || "User")}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                {targetMember.user?.name}
                            </p>
                            {(targetMember.role === "owner" || targetMember.role === "admin") && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                    {targetMember.role}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {targetMember.user?.email}
                        </p>
                        {(targetMember.user as any)?.custom_status && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic truncate mt-0.5">
                                "{(targetMember.user as any).custom_status}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions Options List */}
                <div className="p-2 space-y-1">
                    {/* Make Admin */}
                    {canMakeAdmin && (
                        <button
                            onClick={() => onUpdateRole(targetMember.id, "admin")}
                            disabled={isUpdatingRole || isRemoving}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        >
                            {isUpdatingRole ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                            )}
                            <span>Make Group Admin</span>
                        </button>
                    )}

                    {/* Dismiss as Admin */}
                    {canDismissAdmin && (
                        <button
                            onClick={() => onUpdateRole(targetMember.id, "member")}
                            disabled={isUpdatingRole || isRemoving}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                        >
                            {isUpdatingRole ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                            )}
                            <span>Dismiss as Admin</span>
                        </button>
                    )}

                    {/* Transfer Ownership / Make Owner */}
                    {canMakeOwner && targetMember.role !== "owner" && (
                        <button
                            onClick={() => onUpdateRole(targetMember.id, "owner")}
                            disabled={isUpdatingRole || isRemoving}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                        >
                            {isUpdatingRole ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                                <Crown className="h-4 w-4 shrink-0" />
                            )}
                            <span>Transfer Ownership</span>
                        </button>
                    )}

                    {/* Remove Member Action */}
                    {canRemove && (
                        <button
                            onClick={() => onRemoveMember(targetMember.user_id)}
                            disabled={isRemoving || isUpdatingRole}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            ) : (
                                <UserX className="h-4 w-4 shrink-0" />
                            )}
                            <span>Remove from Group</span>
                        </button>
                    )}

                    {/* Fallback info message if user has no permission */}
                    {!canRemove && !canMakeAdmin && !canDismissAdmin && !canMakeOwner && !isSelf && (
                        <div className="p-3 text-[11px] text-zinc-400 text-center italic bg-zinc-50 dark:bg-white/[0.01] rounded-xl">
                            You don't have permission to manage this member.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

