"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRoles, updateMemberRole } from "@/features/team/api/team.api";
import { Member, Role } from "@/features/team/types";
import { getErrorMessage } from "@/shared/api/ApiError";
import { ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface ChangeMemberRoleModalProps {
    member: Member | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ChangeMemberRoleModal({ member, open, onOpenChange, onSuccess }: ChangeMemberRoleModalProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | string | null>(null);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && member) {
            fetchRoles();
            if (member.role?.id) {
                setSelectedRoleId(member.role.id);
            }
        }
    }, [open, member]);

    const fetchRoles = async () => {
        setIsLoadingRoles(true);
        try {
            const res = await getRoles();
            const loadedRoles = res.roles || [];
            // Exclude owner role from assignment list
            const assignable = loadedRoles.filter((r) => r.slug !== "owner");
            setRoles(assignable);
            if (!selectedRoleId && assignable.length > 0) {
                setSelectedRoleId(assignable[0].id);
            }
        } catch (err) {
            console.error("Failed to load workspace roles", err);
            toast.error(getErrorMessage(err, "Failed to load roles."));
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member || !selectedRoleId) return;

        setIsSaving(true);
        try {
            await updateMemberRole(member.id, selectedRoleId);
            toast.success("Member role updated successfully.");
            onOpenChange(false);
            onSuccess();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update member role."));
        } finally {
            setIsSaving(false);
        }
    };

    if (!member) return null;

    const memberName = member.user?.name || member.user?.email || "Member";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Change Member Role
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                        Update permissions and access role for this workspace member.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-2">
                    {/* Target User Card */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl">
                        <UserAvatar name={memberName} avatarUrl={member.user?.avatar_url || member.user?.avatar} size="sm" />
                        <div className="overflow-hidden">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {memberName}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                Current Role: <span className="font-medium text-blue-600 dark:text-blue-400">{member.role?.name || "Member"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-900 dark:text-white">Select New Role</label>
                        {isLoadingRoles ? (
                            <div className="text-xs text-zinc-500">Loading roles...</div>
                        ) : (
                            <select
                                value={selectedRoleId || ""}
                                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                                        {r.name} {r.description ? `(${r.description})` : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !selectedRoleId}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium"
                        >
                            {isSaving ? "Saving..." : "Save Role"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
