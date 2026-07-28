"use client";

import { BarChart3 } from "lucide-react";

import type { DashboardSummary } from "@/feature/dashboard/api/dashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskDistributionCardProps = {
  isLoading: boolean;
  summary: DashboardSummary | null;
};

const COLORS = ["#38bdf8", "#f59e0b", "#f43f5e", "#10b981", "#a78bfa"];

export default function TaskDistributionCard({
  isLoading,
  summary,
}: TaskDistributionCardProps) {
  const totalTasks = summary?.stats.total_tasks ?? 0;
  const distributionData = summary?.task_distribution
    ? Object.entries(summary.task_distribution).map(([name, value]) => ({
        name: name.replaceAll("_", " "),
        value,
        percentage: totalTasks > 0 ? Math.round((value / totalTasks) * 100) : 0,
      }))
    : [];

  return (
    <Card className="col-span-3 border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
              Task Distribution
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              How current work is split across statuses.
            </p>
          </div>
          <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Total tracked tasks
          </p>
          <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
            {isLoading ? "..." : totalTasks}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-[260px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
        ) : distributionData.length > 0 ? (
          distributionData.map((item, index) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold capitalize text-zinc-800 dark:text-zinc-200">
                  {item.name.toLowerCase()}
                </span>
                <span className="text-zinc-500">
                  {item.value} tasks • {item.percentage}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-zinc-100 dark:bg-white/5">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300/80 p-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            No task distribution is available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
