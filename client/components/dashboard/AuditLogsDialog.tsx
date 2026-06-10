"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Download, Filter, SlidersHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { exportAuditLogs, getAuditLogs } from "@/features/settings/api/settings.api";
import { AuditLog, AuditLogFilters } from "@/features/settings/types";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";

const actionOptions = [
    { value: "", label: "All actions" },
    { value: "lead_created", label: "Lead created" },
    { value: "lead_updated", label: "Lead updated" },
    { value: "lead_stage_changed", label: "Lead stage changed" },
    { value: "lead_converted_to_student", label: "Lead converted" },
    { value: "student_created", label: "Student created" },
    { value: "student_status_updated", label: "Student status updated" },
    { value: "course_created", label: "Course created" },
    { value: "course_updated", label: "Course updated" },
];

const initialFilters: AuditLogFilters = {
    from: "",
    to: "",
    event_type: "",
    assignee_user_id: "",
    per_page: 20,
};

export function AuditLogsDialog() {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const assigneeOptions = useMemo(
        () =>
            members.map((member) => ({
                value: member.user_id,
                label: member.user?.name || member.user?.email || member.user_id,
            })),
        [members]
    );

    useEffect(() => {
        if (!open || members.length > 0 || isLoadingMembers) {
            return;
        }

        setIsLoadingMembers(true);

        getMembers()
            .then((response) => setMembers(response.members || []))
            .catch((error) => console.error("Failed to fetch audit assignees:", error))
            .finally(() => setIsLoadingMembers(false));
    }, [open, members.length, isLoadingMembers]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setIsLoading(true);

        getAuditLogs(filters)
            .then((response) => setLogs(response.audit_logs || []))
            .catch((error) => {
                console.error("Failed to fetch audit logs:", error);
                setLogs([]);
            })
            .finally(() => setIsLoading(false));
    }, [open, filters]);

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const activeFilterCount = [
        filters.from,
        filters.to,
        filters.event_type,
        filters.assignee_user_id,
    ].filter(Boolean).length;

    const handleExport = async () => {
        setIsExporting(true);

        try {
            await exportAuditLogs(filters);
            toast.success("Audit log export started.");
        } catch (error) {
            console.error("Failed to export audit logs:", error);
            toast.error("Failed to export audit logs.");
        } finally {
            setIsExporting(false);
        }
    };

    const describeAction = (eventType: string) =>
        eventType
            .split("_")
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" ");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" className="rounded-xl border-zinc-200 dark:border-white/10" />}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Audit Filters
            </DialogTrigger>
            <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b border-zinc-200 bg-gradient-to-r from-zinc-50 via-white to-sky-50 px-6 py-5 dark:border-white/10 dark:from-[#101010] dark:via-[#0b0b0b] dark:to-[#0f172a]">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Workspace Timeline
                            </div>
                            <DialogTitle className="text-lg text-zinc-900 dark:text-white">Filtered Audit Logs</DialogTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="rounded-xl border-zinc-200 bg-white/80 dark:border-white/10 dark:bg-white/5"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {isExporting ? "Exporting..." : "Export CSV"}
                            </Button>
                        </div>
                    </div>
                    <DialogDescription>
                        Review workspace activity with essential CRM filters and export the current result set.
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            <Filter className="h-4 w-4" />
                            Essential Filters
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 dark:border-white/10 dark:bg-white/5">
                                {activeFilterCount} active filters
                            </span>
                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 dark:border-white/10 dark:bg-white/5">
                                {logs.length} results
                            </span>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">From</label>
                            <div className="relative">
                                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="date"
                                    value={filters.from || ""}
                                    onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">To</label>
                            <div className="relative">
                                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="date"
                                    value={filters.to || ""}
                                    onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value }))}
                                    className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Action</label>
                            <select
                                value={filters.event_type || ""}
                                onChange={(e) => setFilters((current) => ({ ...current, event_type: e.target.value }))}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                {actionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Assignee</label>
                            <select
                                value={filters.assignee_user_id || ""}
                                onChange={(e) => setFilters((current) => ({ ...current, assignee_user_id: e.target.value }))}
                                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                disabled={isLoadingMembers}
                            >
                                <option value="">All assignees</option>
                                {assigneeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="max-h-[28rem] overflow-auto bg-[linear-gradient(180deg,rgba(250,250,250,0.65),rgba(255,255,255,0))] px-6 py-4 dark:bg-none">
                    {isLoading ? (
                        <div className="py-10 text-center text-sm text-zinc-500">Loading audit logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="py-10 text-center text-sm text-zinc-500">No audit logs match these filters.</div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                                                    {describeAction(log.event_type)}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                                                    {log.target_type || "record"}
                                                    {log.target_id ? ` #${log.target_id}` : ""}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                                {log.actor?.name || "System"} updated {log.target_type || "record"}
                                                {log.target_id ? ` #${log.target_id}` : ""}
                                            </p>
                                            {log.metadata ? (
                                                <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {Object.entries(log.metadata)
                                                        .slice(0, 3)
                                                        .map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.03]"
                                                            >
                                                                {key}: {String(value)}
                                                            </span>
                                                        ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                                                {new Date(log.occurred_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {new Date(log.occurred_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-zinc-200 dark:border-white/10">
                    <Button type="button" variant="outline" onClick={resetFilters}>
                        Reset
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
