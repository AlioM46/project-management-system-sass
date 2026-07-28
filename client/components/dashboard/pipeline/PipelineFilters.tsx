/**
 * # PipelineFilters Component
 * 
 * This component renders the filter bar for the Leads Pipeline.
 * It allows staff/advisors to filter the board by:
 * 1. Course (Project ID)
 * 2. Assignee (Advisor/Staff ID)
 * 
 * It also renders a "Reset Filters" action button when any filter is active.
 */

import { Filter, Users, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/features/projects/types";
import { Member } from "@/features/team/types";

interface PipelineFiltersProps {
    filters: {
        project_id: string;
        assignee_id: string;
        sort_by: string;
        sort_dir: string;
    };
    onChange: (updater: (prev: any) => any) => void;
    courses: Course[];
    members: Member[];
    t: (key: any) => string;
}

export default function PipelineFilters({
    filters,
    onChange,
    courses,
    members,
    t,
}: PipelineFiltersProps) {
    const hasActiveFilters = 
        filters.project_id || 
        filters.assignee_id || 
        filters.sort_by !== "created_at" || 
        filters.sort_dir !== "desc";

    const handleClearFilters = () => {
        onChange(() => ({
            project_id: "",
            assignee_id: "",
            sort_by: "created_at",
            sort_dir: "desc"
        }));
    };

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-white/5 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium mr-2">
                <Filter className="h-4 w-4" />
                <span>{t("pipeline_filters")}</span>
            </div>
            
            {/* Course Filter */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 uppercase font-bold">{t("pipeline_filter_course")}</span>
                <select 
                    value={filters.project_id}
                    onChange={(e) => onChange(prev => ({ ...prev, project_id: e.target.value }))}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[150px]"
                >
                    <option value="" className="dark:bg-zinc-900">{t("pipeline_all_courses")}</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id} className="dark:bg-zinc-900">{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 uppercase font-bold">{t("pipeline_filter_assignee")}</span>
                <div className="relative flex items-center">
                    <Users className="absolute start-3 h-3.5 w-3.5 text-zinc-400" />
                    <select 
                        value={filters.assignee_id}
                        onChange={(e) => onChange(prev => ({ ...prev, assignee_id: e.target.value }))}
                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl ps-9 pe-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[150px]"
                    >
                        <option value="" className="dark:bg-zinc-900">{t("pipeline_all_assignees")}</option>
                        {members.map(m => (
                            <option key={m.id} value={m.user_id} className="dark:bg-zinc-900">
                                {m.user?.name || m.user?.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="text-zinc-500 hover:text-red-500 gap-2 h-9 px-3 rounded-xl ms-auto"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("pipeline_clear_filters")}
                </Button>
            )}
        </div>
    );
}
