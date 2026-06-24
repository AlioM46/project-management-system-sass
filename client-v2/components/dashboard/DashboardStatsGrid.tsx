"use client";

import {
  Activity,
  CheckSquare,
  FolderKanban,
  type LucideIcon,
  Users,
} from "lucide-react";

import type { DashboardSummary } from "@/feature/dashboard/api/dashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function DashboardStatCard({
  color,
  description,
  icon: Icon,
  isLoading,
  title,
  value,
}: StatConfig & { isLoading: boolean }) {
  return (
    <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#0d1118]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-zinc-100 p-2 dark:bg-white/5">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-10 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/5" />
        ) : (
          <div className="text-3xl font-black text-zinc-950 dark:text-white">
            {value}
          </div>
        )}
        <p className="mt-2 text-xs font-medium leading-5 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardStatsGrid({
  isLoading,
  summary,
}: DashboardStatsGridProps) {
  const completionRate = summary?.summary.completion_rate ?? 0;
  const totalTasks = summary?.stats.total_tasks ?? 0;

  const stats: StatConfig[] = [
    {
      title: "Total Projects",
      value: summary?.stats.total_projects ?? 0,
      description: `${totalTasks} tracked tasks across all projects`,
      icon: FolderKanban,
      color: "text-sky-500",
    },
    {
      title: "Active Tasks",
      value: summary?.stats.active_tasks ?? 0,
      description: "Open work excluding completed and cancelled tasks",
      icon: Activity,
      color: "text-amber-500",
    },
    {
      title: "Completed Tasks",
      value: summary?.stats.completed_tasks ?? 0,
      description: `${completionRate}% of all tasks are complete`,
      icon: CheckSquare,
      color: "text-emerald-500",
    },
    {
      title: "Team Members",
      value: summary?.stats.total_members ?? 0,
      description: `${summary?.summary.activity_count_7d ?? 0} audit events in the last 7 days`,
      icon: Users,
      color: "text-fuchsia-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardStatCard key={stat.title} isLoading={isLoading} {...stat} />
      ))}
    </div>
  );
}
