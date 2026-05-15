"use client";

import { useState, useEffect } from "react";
import { Settings2, Shield, Activity, Save, Trash2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuditLogs, updateWorkspaceSettings, deleteWorkspace } from "@/features/settings/api/settings.api";
import { AuditLog } from "@/features/settings/types";
import { toast } from "sonner";
import { getCookie } from "@/shared/utils/cookies";

export default function SettingsPage() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [workspaceName, setWorkspaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Mock getting current workspace name
        setWorkspaceName(`Workspace #${getCookie("workspace_id") || "Current"}`);

        const fetchLogs = async () => {
            try {
                const response = await getAuditLogs();
                setAuditLogs(response.logs || (Array.isArray(response) ? response : []));
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
                // Don't toast error here as audit logs might not be accessible to all roles
            } finally {
                setIsLoadingLogs(false);
            }
        };

        fetchLogs();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateWorkspaceSettings({ name: workspaceName });
            toast.success("Workspace settings updated.");
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error("Failed to update workspace settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you absolutely sure you want to delete this workspace? This cannot be undone.")) return;
        try {
            await deleteWorkspace();
            toast.success("Workspace deleted.");
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Failed to delete workspace:", error);
            toast.error("Failed to delete workspace.");
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Workspace Settings</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage your workspace preferences, security, and data.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* General Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                <Building className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">General Information</h3>
                                <p className="text-sm text-zinc-500">Update your workspace identity and core settings.</p>
                            </div>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-white">Workspace Name</label>
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="w-full max-w-md px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                            </Button>
                        </form>
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                    <Activity className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Audit Logs</h3>
                                    <p className="text-sm text-zinc-500">Track all activity within your workspace.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-0">
                            {isLoadingLogs ? (
                                <div className="p-8 text-center text-zinc-500">Loading logs...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 border-t border-zinc-200 dark:border-white/10">No recent activity found.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Action</th>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                        {auditLogs.slice(0, 10).map((log) => (
                                            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                                                <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">{log.action}</td>
                                                <td className="px-6 py-3 text-zinc-500">{log.user?.name || log.user_id}</td>
                                                <td className="px-6 py-3 text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Danger Zone Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-500/5">
                            <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Danger Zone
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Deleting this workspace will permanently remove all associated projects, tasks, and data. This action cannot be undone.
                            </p>
                            <Button onClick={handleDelete} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Workspace
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
