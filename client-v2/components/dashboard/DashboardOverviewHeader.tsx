"use client";

import { Activity, CheckCheck, FolderKanban, Sparkles } from "lucide-react";

import type { DashboardSummary } from "@/feature/dashboard/api/dashboard.api";

type DashboardOverviewHeaderProps = {
  workspaceId: string | null;
  isLoading: boolean;
  summary: DashboardSummary | null;
};

const heroStats = [
  {
    key: "tasks_completed_7d",
    label: "Completed this week",
    icon: CheckCheck,
    tone:
      "from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "tasks_created_7d",
    label: "Created this week",
    icon: FolderKanban,
    tone:
      "from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-300",
  },
  {
    key: "activity_count_7d",
    label: "Audit events",
    icon: Activity,
    tone:
      "from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-300",
  },
  {
    key: "completion_rate",
    label: "Completion rate",
    icon: Sparkles,
    tone:
      "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-700 dark:text-fuchsia-300",
    suffix: "%",
  },
] as const;

export default function DashboardOverviewHeader({
  workspaceId,
  isLoading,
  summary,
}: DashboardOverviewHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white px-6 py-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#0b0f19] md:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(244,244,245,0.92))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(135deg,_rgba(10,15,28,0.98),_rgba(7,10,18,0.95))]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Workspace analytics
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
              Delivery, workload, and audit activity aligned in one dashboard.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 md:text-base">
              Workspace #{workspaceId || "Unknown"} shows current delivery pace,
              workload growth, and the latest audit trail for your team.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {heroStats.map(({ key, label, icon: Icon, tone, suffix }) => (
            <div
              key={key}
              className={`rounded-2xl border border-white/60 bg-gradient-to-br ${tone} p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-current/75">
                  {label}
                </p>
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-4">
                {isLoading ? (
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
                ) : (
                  <span className="text-3xl font-black text-zinc-950 dark:text-white">
                    {summary?.summary[key] ?? 0}
                    {suffix ?? ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
