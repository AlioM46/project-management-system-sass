"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Role } from "../types";

interface DeleteRoleDialogProps {
    role: Role | null;
    onOpenChange: (open: boolean) => void;
    onDelete: (roleId: number) => Promise<boolean>;
}

export function DeleteRoleDialog({ role, onOpenChange, onDelete }: DeleteRoleDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!role) return null;

    const hasMembers = role.member_count > 0;

    const handleDelete = async () => {
        if (hasMembers) return;
        setIsDeleting(true);
        const success = await onDelete(role.id);
        setIsDeleting(false);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-red-200 dark:border-red-500/20 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-500/5 flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Delete Role &quot;{role.name}&quot;</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">This action cannot be undone.</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {hasMembers ? (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
                            <p className="font-semibold">Cannot Delete Active Role</p>
                            <p>
                                There are currently <strong>{role.member_count} member(s)</strong> assigned to this role. You must reassign those members to another role before you can delete this role.
                            </p>
                        </div>
                    ) : (
                        <p>
                            Are you sure you want to permanently delete the custom role <strong>&quot;{role.name}&quot;</strong>? Any unassigned permissions will be detached.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isDeleting}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting || hasMembers}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium shadow-sm"
                        >
                            {isDeleting ? "Deleting..." : <><Trash2 className="h-4 w-4 mr-1" /> Confirm Delete</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
