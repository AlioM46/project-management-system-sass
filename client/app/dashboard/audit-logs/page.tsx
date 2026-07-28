"use client";

import React, { useState, useEffect } from "react";
import { ScrollText, Filter, Download, RotateCcw, ChevronLeft, ChevronRight, User, Tag, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAuditLogs, exportAuditLogs, AuditLogFilters, PaginatedAuditLogsResponse } from "@/features/settings/api/settings.api";
import { AuditLog } from "@/features/settings/types";
import { getErrorMessage } from "@/shared/api/ApiError";

// Predefined Entity Types for Filter Dropdown
const ENTITY_TYPES = [
    { label: "All Entity Types", value: "" },
    { label: "Task", value: "task" },
    { label: "Project", value: "project" },
    { label: "Workspace", value: "workspace" },
    { label: "Role", value: "role" },
    { label: "Comment", value: "comment" },
    { label: "Audit Log", value: "audit_log" },
    { label: "Workspace Member", value: "workspace_member" },
];

// Predefined Event Actions for Filter Dropdown
const EVENT_TYPES = [
    { label: "All Event Actions", value: "" },
    { label: "Workspace Created", value: "workspace_created" },
    { label: "Workspace Updated", value: "workspace_updated" },
    { label: "Workspace Deleted", value: "workspace_deleted" },
    { label: "Project Created", value: "project_created" },
    { label: "Project Updated", value: "project_updated" },
    { label: "Project Deleted", value: "project_deleted" },
    { label: "Task Created", value: "task_created" },
    { label: "Task Status Changed", value: "task_status_changed" },
    { label: "Task Updated", value: "task_updated" },
    { label: "Task Deleted", value: "task_deleted" },
    { label: "Task Assignee Added", value: "task_assignee_added" },
    { label: "Task Assignee Removed", value: "task_assignee_removed" },
    { label: "Comment Created", value: "comment_created" },
    { label: "Role Created", value: "role_created" },
    { label: "Role Updated", value: "role_updated" },
    { label: "Role Deleted", value: "role_deleted" },
    { label: "Audit Exported", value: "audit_exported" },
];

// Helper: Return specific colors for each Entity Type
function getEntityTypeBadgeStyle(targetType: string) {
    const type = targetType?.toLowerCase() || "";
    if (type.includes("task")) {
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
    if (type.includes("project")) {
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
    if (type.includes("workspace")) {
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (type.includes("role") || type.includes("permission")) {
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    if (type.includes("comment")) {
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    }
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
}

export default function StandaloneAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Filter states
    const [targetId, setTargetId] = useState("");
    const [targetType, setTargetType] = useState("");
    const [actorUserId, setActorUserId] = useState("");
    const [eventType, setEventType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Fetch audit logs whenever page or filters change
    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const filters: AuditLogFilters = {
                page,
                per_page: 20,
                target_id: targetId.trim() || undefined,
                target_type: targetType || undefined,
                actor_user_id: actorUserId.trim() || undefined,
                event_type: eventType || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            };

            const response: PaginatedAuditLogsResponse = await getAuditLogs(filters);
            setLogs(response.data);
            setPage(response.current_page);
            setLastPage(response.last_page);
            setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
            toast.error(getErrorMessage(error, "Failed to load audit logs."));
        } finally {
            setIsLoading(false);
        }
    };

    // Apply active filter inputs
    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // reset to page 1 on new filter apply
        fetchLogs();
    };

    // Reset filter inputs to default empty state
    const handleResetFilters = () => {
        setTargetId("");
        setTargetType("");
        setActorUserId("");
        setEventType("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
        setTimeout(() => fetchLogs(), 50);
    };

    // Export CSV with active filters
    const handleExportCSV = async () => {
        try {
            await exportAuditLogs({
                target_id: targetId.trim() || undefined,
                target_type: targetType || undefined,
                actor_user_id: actorUserId.trim() || undefined,
                event_type: eventType || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            });
            toast.success("CSV export initiated.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to export audit logs."));
        }
    };

    return (
        <div className="flex-1 space-y-6 p-6 sm:p-8 max-w-7xl mx-auto w-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                        <ScrollText className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                        Workspace Audit Logs
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Comprehensive security and activity audit records for your entire workspace.
                    </p>
                </div>

                <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="gap-2 rounded-xl text-xs font-medium border-zinc-200 dark:border-white/10 shrink-0"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filter Toolbar Card */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10 pb-3">
                    <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Filter Audit Records</span>
                </div>

                <form onSubmit={handleApplyFilters} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Entity Type Filter (Select) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Entity Type
                            </label>
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            >
                                {ENTITY_TYPES.map((t) => (
                                    <option key={t.value} value={t.value} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Event Action Filter (Select) */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <ScrollText className="h-3 w-3" /> Event Action
                            </label>
                            <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            >
                                {EVENT_TYPES.map((e) => (
                                    <option key={e.value} value={e.value} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                                        {e.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Target ID Filter */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Hash className="h-3 w-3" /> Entity ID
                            </label>
                            <input
                                type="text"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                placeholder="e.g. 42"
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>

                        {/* 4. User ID Filter */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <User className="h-3 w-3" /> User ID
                            </label>
                            <input
                                type="text"
                                value={actorUserId}
                                onChange={(e) => setActorUserId(e.target.value)}
                                placeholder="e.g. 1"
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>

                        {/* 5. Date From Filter */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> From Date
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>

                        {/* 6. Date To Filter */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> To Date
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="rounded-xl text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm"
                        >
                            <Filter className="h-3.5 w-3.5 mr-1" /> Apply Filters
                        </Button>
                    </div>
                </form>
            </div>

            {/* Audit Logs Full Width Data Table */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Loading audit logs...
                    </div>
                ) : (!Array.isArray(logs) || logs.length === 0) ? (
                    <div className="p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        No audit records found matching your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                            <thead className="bg-zinc-50 dark:bg-white/5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-white/10">
                                <tr>
                                    <th className="px-4 py-3.5">ID</th>
                                    <th className="px-4 py-3.5">Entity Type</th>
                                    <th className="px-4 py-3.5">Event Action</th>
                                    <th className="px-4 py-3.5">Entity ID</th>
                                    <th className="px-4 py-3.5">Performed By</th>
                                    <th className="px-4 py-3.5">Changes / Details</th>
                                    <th className="px-4 py-3.5">IP Address</th>
                                    <th className="px-4 py-3.5">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                {(Array.isArray(logs) ? logs : []).map((log) => {
                                    const badgeStyle = getEntityTypeBadgeStyle(log.target_type);
                                    const actorName = log.actor?.name || `User #${log.actor_user_id || "System"}`;
                                    const dateStr = log.occurred_at || log.created_at;

                                    return (
                                        <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">#{log.id}</td>
                                            
                                            {/* Colored Entity Badge */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
                                                    {log.target_type}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-white">
                                                {log.event_type}
                                            </td>

                                            <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500">
                                                {log.target_id ? `#${log.target_id}` : "-"}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-zinc-900 dark:text-white">{actorName}</div>
                                                {log.actor?.email && (
                                                    <div className="text-[10px] text-zinc-400">{log.actor.email}</div>
                                                )}
                                            </td>

                                            {/* Changes Diff View */}
                                            <td className="px-4 py-3.5 max-w-sm truncate">
                                                {log.old_values || log.new_values ? (
                                                    <div className="text-[11px] space-y-0.5 font-mono">
                                                        {log.old_values && (
                                                            <div className="text-red-500 dark:text-red-400 truncate">
                                                                - {JSON.stringify(log.old_values)}
                                                            </div>
                                                        )}
                                                        {log.new_values && (
                                                            <div className="text-emerald-600 dark:text-emerald-400 truncate">
                                                                + {JSON.stringify(log.new_values)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-400 text-[10px] italic">No values recorded</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                                                {log.ip_address || "-"}
                                            </td>

                                            <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap text-[11px]">
                                                {dateStr ? new Date(dateStr).toLocaleString() : "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-white/5 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-500">
                        <div>
                            Showing page <span className="font-semibold text-zinc-900 dark:text-white">{page}</span> of{" "}
                            <span className="font-semibold text-zinc-900 dark:text-white">{lastPage}</span> ({total} total logs)
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || isLoading}
                                className="h-7 px-2 text-xs rounded-lg"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                disabled={page >= lastPage || isLoading}
                                className="h-7 px-2 text-xs rounded-lg"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
