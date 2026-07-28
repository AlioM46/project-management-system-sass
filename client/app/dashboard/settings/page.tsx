"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, Building, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateWorkspaceSettings, deleteWorkspace, leaveWorkspace } from "@/features/settings/api/settings.api";
import { toast } from "sonner";
import { getCookie, removeCookie } from "@/shared/utils/cookies";
import { getErrorMessage } from "@/shared/api/ApiError";

export default function GeneralSettingsPage() {
    const [workspaceName, setWorkspaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setWorkspaceName(`Workspace #${getCookie("workspace_id") || "Current"}`);
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateWorkspaceSettings({ name: workspaceName });
            toast.success("Workspace settings updated.");
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error(getErrorMessage(error, "Failed to update workspace settings."));
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeaveWorkspace = async () => {
        if (!confirm("Are you sure you want to leave this workspace? If you are the owner, ownership will automatically transfer to another admin or member.")) return;

        setIsLeaving(true);
        try {
            await leaveWorkspace();
            removeCookie("workspace_id");
            toast.success("You have left the workspace.");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Failed to leave workspace:", error);
            toast.error(getErrorMessage(error, "Failed to leave workspace."));
        } finally {
            setIsLeaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you absolutely sure you want to delete this workspace? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            await deleteWorkspace();
            removeCookie("workspace_id");
            toast.success("Workspace deleted.");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Failed to delete workspace:", error);
            toast.error(getErrorMessage(error, "Failed to delete workspace."));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">General Settings</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Manage workspace identity and core preferences.
                </p>
            </div>

            {/* General Information */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                        <Building className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-zinc-900 dark:text-white">General Information</h4>
                        <p className="text-xs text-zinc-500">Update your workspace identity.</p>
                    </div>
                </div>
                <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-white">Workspace Name</label>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="w-full max-w-md px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium">
                        {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm overflow-hidden space-y-0 divide-y divide-zinc-200 dark:divide-white/10">
                <div className="p-6 bg-red-50/50 dark:bg-red-500/5">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Danger Zone
                    </h4>
                </div>

                {/* Leave Workspace */}
                <div className="p-6 space-y-3">
                    <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">Leave Workspace</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Revoke your membership from this workspace. If you are the owner, workspace ownership will automatically be transferred to another member.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleLeaveWorkspace}
                        disabled={isLeaving}
                        className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl text-xs font-medium"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isLeaving ? "Leaving..." : "Leave Workspace"}
                    </Button>
                </div>

                {/* Delete Workspace */}
                <div className="p-6 space-y-3">
                    <h5 className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Workspace</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Deleting this workspace will permanently remove all associated projects, tasks, and data. This action cannot be undone.
                    </p>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete Workspace"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
