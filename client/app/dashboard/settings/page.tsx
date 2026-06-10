"use client";

import { useState, useEffect } from "react";
import { Shield, Activity, Save, Trash2, Building, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuditLogs, updateWorkspaceSettings, deleteWorkspace } from "@/features/settings/api/settings.api";
import { AuditLog, AuditLogFilters } from "@/features/settings/types";
import { toast } from "sonner";
import { getCookie } from "@/shared/utils/cookies";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function SettingsPage() {
    const { t } = useTranslation();
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [workspaceName, setWorkspaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [filters, setFilters] = useState<AuditLogFilters>({
        from: "",
        to: "",
        event_type: "",
        target_type: "",
        actor_user_id: "",
        assignee_user_id: "",
        per_page: 30,
    });

    useEffect(() => {
        // Mock getting current workspace name
        setWorkspaceName(`Workspace #${getCookie("workspace_id") || "Current"}`);
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { audit_logs } = await getAuditLogs(filters);

                setAuditLogs(audit_logs || []);
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
                // Don't toast error here as audit logs might not be accessible to all roles
            } finally {
                setIsLoadingLogs(false);
            }
        };

        setIsLoadingLogs(true);
        fetchLogs();
    }, [filters]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await getMembers();
                setMembers(response.members || []);
            } catch (error) {
                console.error("Failed to fetch members for audit filters:", error);
            }
        };

        fetchMembers();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateWorkspaceSettings({ name: workspaceName });
            toast.success(t("settings_toast_updated"));
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error(t("settings_toast_update_error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t("settings_confirm_delete"))) return;
        try {
            await deleteWorkspace();
            toast.success(t("settings_toast_deleted"));
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Failed to delete workspace:", error);
            toast.error(t("settings_toast_delete_error"));
        }
    };

    const resetFilters = () => {
        setFilters({
            from: "",
            to: "",
            event_type: "",
            target_type: "",
            actor_user_id: "",
            assignee_user_id: "",
            per_page: 30,
        });
    };

    const eventOptions = [
        { value: "", label: t("settings_all_actions") },
        { value: "course_created", label: t("course_details_created") },
        { value: "course_updated", label: t("courses_new_course") },
        { value: "lead_created", label: t("modal_create_lead_title") },
        { value: "lead_updated", label: t("pipeline_toast_moved") },
        { value: "lead_stage_changed", label: t("db_stage") },
        { value: "lead_converted_to_student", label: t("db_conversion_title") },
        { value: "student_created", label: t("db_conversion_desc") },
        { value: "student_status_updated", label: t("team_col_status") },
        { value: "comment_created", label: t("modal_lead_details_add_comment") },
        { value: "audit_exported", label: t("settings_audit_logs") },
    ];

    const entityOptions = [
        { value: "", label: t("settings_all_entities") },
        { value: "course", label: t("db_courses_title") },
        { value: "lead", label: t("db_leads_title") },
        { value: "student", label: t("db_conversion_title") },
        { value: "comment", label: t("modal_lead_details_add_comment") },
        { value: "outbound_message", label: t("settings_tab_whatsapp") },
        { value: "workspace", label: t("settings_ws_name") },
    ];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl text-start">
            <div className="flex items-center justify-between text-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t("settings_title")}</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        {t("settings_subtitle")}
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3 text-start">
                {/* General Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex items-center gap-3">
                            <div className="h-10 w-10 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                <Building className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("settings_general_info")}</h3>
                                <p className="text-sm text-zinc-500">{t("settings_general_desc")}</p>
                            </div>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900 dark:text-white">{t("settings_ws_name")}</label>
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="w-full max-w-md px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                {isSaving ? t("settings_saving") : <><Save className="h-4 w-4 me-2" /> {t("settings_save_btn")}</>}
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
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("settings_audit_logs")}</h3>
                                    <p className="text-sm text-zinc-500">{t("settings_audit_desc")}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] p-4 text-start">
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                <Filter className="h-4 w-4" />
                                {t("settings_audit_filters")}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_from_date")}</label>
                                    <input
                                        type="date"
                                        value={filters.from || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_to_date")}</label>
                                    <input
                                        type="date"
                                        value={filters.to || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_action")}</label>
                                    <select
                                        value={filters.event_type || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, event_type: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white font-normal"
                                    >
                                        {eventOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_entity")}</label>
                                    <select
                                        value={filters.target_type || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, target_type: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white font-normal"
                                    >
                                        {entityOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_actor")}</label>
                                    <select
                                        value={filters.actor_user_id || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, actor_user_id: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white font-normal"
                                    >
                                        <option value="">{t("settings_all_actors")}</option>
                                        {members.map((member) => (
                                            <option key={member.user_id} value={member.user_id}>
                                                {member.user?.name || member.user?.email || member.user_id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("settings_lead_assignee")}</label>
                                    <select
                                        value={filters.assignee_user_id || ""}
                                        onChange={(e) => setFilters((current) => ({ ...current, assignee_user_id: e.target.value }))}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white font-normal"
                                    >
                                        <option value="">{t("settings_all_assignees")}</option>
                                        {members.map((member) => (
                                            <option key={member.user_id} value={member.user_id}>
                                                {member.user?.name || member.user?.email || member.user_id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <Button type="button" variant="outline" onClick={resetFilters} className="rounded-xl">
                                    <RotateCcw className="me-2 h-4 w-4" />
                                    {t("settings_reset_filters")}
                                </Button>
                            </div>
                        </div>
                        <div className="p-0">
                            {isLoadingLogs ? (
                                <div className="p-8 text-center text-zinc-500">{t("settings_loading_logs")}</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 border-t border-zinc-200 dark:border-white/10">{t("settings_no_activity")}</div>
                            ) : (
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">{t("settings_col_action")}</th>
                                            <th className="px-6 py-3">{t("settings_col_actor")}</th>
                                            <th className="px-6 py-3">{t("settings_col_entity")}</th>
                                            <th className="px-6 py-3">{t("settings_col_date")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                        {auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                                                <td className="px-6 py-3 font-medium text-zinc-900 dark:text-white">{log.event_type}</td>
                                                <td className="px-6 py-3 text-zinc-500">{log.actor?.name || log.actor_user_id || "System"}</td>
                                                <td className="px-6 py-3 text-zinc-500">
                                                    {log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ""}` : "N/A"}
                                                </td>
                                                <td className="px-6 py-3 text-zinc-500">{new Date(log.occurred_at).toLocaleString()}</td>
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
                    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm overflow-hidden text-start">
                        <div className="p-6 border-b border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-500/5">
                            <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                {t("settings_danger_zone")}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {t("settings_danger_desc_detailed")}
                            </p>
                            <Button onClick={handleDelete} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                <Trash2 className="h-4 w-4 me-2" />
                                {t("settings_delete_ws_btn")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
