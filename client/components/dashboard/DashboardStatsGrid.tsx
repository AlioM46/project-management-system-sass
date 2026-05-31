import {
    Activity,
    CheckSquare,
    FolderKanban,
    LucideIcon,
    Users,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

type DashboardStatsGridProps = {
    isLoading: boolean;
    summary: DashboardSummary | null;
};

type StatConfig = {
    color: string;
    description: string;
    icon: LucideIcon;
    title: string;
    value: number;
};

export function DashboardStatsGrid({ isLoading, summary }: DashboardStatsGridProps) {
    const stats: StatConfig[] = [
        {
            title: "Total Projects",
            value: summary?.stats.total_projects ?? 0,
            description: "Projects in this workspace",
            icon: FolderKanban,
            color: "text-blue-500",
        },
        {
            title: "Active Tasks",
            value: summary?.stats.active_tasks ?? 0,
            description: "Work in progress",
            icon: Activity,
            color: "text-amber-500",
        },
        {
            title: "Completed Tasks",
            value: summary?.stats.completed_tasks ?? 0,
            description: "Tasks marked as Done",
            icon: CheckSquare,
            color: "text-emerald-500",
        },
        {
            title: "Team Members",
            value: summary?.stats.total_members ?? 0,
            description: "Total collaborators",
            icon: Users,
            color: "text-purple-500",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <DashboardStatCard key={stat.title} isLoading={isLoading} {...stat} />
            ))}
        </div>
    );
}
