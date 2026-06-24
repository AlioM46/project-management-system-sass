"use client";

import { Activity, ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";

import type { DashboardSummary } from "@/feature/dashboard/api/dashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecentActivityPanelProps = {
  isLoading: boolean;
  summary: DashboardSummary | null;
};

function formatAbsoluteDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.round((date - now) / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export default function RecentActivityPanel({
  isLoading,
  summary,
}: RecentActivityPanelProps) {
  const recentActivity = summary?.recent_activity ?? [];
  const featuredActivity = recentActivity[0];

  return (
    <Card className="col-span-7 border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
      <CardHeader className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
              Workspace Audit Feed
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              A larger timeline view of the latest team actions and system
              events.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
          <div className="rounded-[1.75rem] border border-zinc-200/70 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f0fdf4_100%)] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.16)_0%,rgba(255,255,255,0.02)_55%,rgba(16,185,129,0.14)_100%)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Latest event
              </p>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </div>

            {isLoading ? (
              <div className="mt-4 h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
            ) : featuredActivity ? (
              <div className="mt-4 space-y-3">
                <p className="text-lg font-bold text-zinc-950 dark:text-white">
                  {featuredActivity.summary}
                </p>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Most recent audit event captured for this workspace feed.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-zinc-700 shadow-sm dark:bg-white/10 dark:text-zinc-200">
                    {featuredActivity.event_label}
                  </span>
                  <span className="rounded-full bg-zinc-950 px-3 py-1 text-white dark:bg-white dark:text-zinc-950">
                    {featuredActivity.target_label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300/80 p-6 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                No audit events available yet.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Feed items
              </p>
              <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                {isLoading ? "..." : recentActivity.length}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                7d events
              </p>
              <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                {isLoading ? "..." : summary?.summary.activity_count_7d ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Audit source
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700 dark:text-zinc-200">
                Live events pulled from workspace audit logs.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {isLoading ? (
            [1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex animate-pulse items-center space-x-4 rounded-[1.75rem] bg-zinc-50 p-5 dark:bg-white/[0.02]"
              >
                <div className="h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-3 w-full rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-white/10" />
                </div>
              </div>
            ))
          ) : recentActivity.length > 0 ? (
            recentActivity.map((log) => {
              const metadataEntries = Object.entries(log.metadata ?? {}).slice(
                0,
                2
              );

              return (
                <div
                  key={log.id}
                  className="group rounded-[1.75rem] border border-zinc-200/70 bg-white/80 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/30 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-black text-white shadow-lg">
                      {log.actor_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                            {log.actor_name}
                          </p>
                          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            {log.summary}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                          {log.event_label}
                        </span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {log.target_label}
                        </span>
                      </div>

                      {metadataEntries.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {metadataEntries.map(([key, value]) => (
                            <span
                              key={key}
                              className="rounded-full border border-zinc-200/80 px-3 py-1 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400"
                            >
                              {key.replaceAll("_", " ")}: {String(value)}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatRelativeTime(log.occurred_at)}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">|</span>
                        <span>{formatAbsoluteDate(log.occurred_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center space-y-4 py-20 text-zinc-500">
              <div className="rounded-full bg-zinc-100 p-4 dark:bg-white/5">
                <Activity className="h-10 w-10 text-zinc-300" />
              </div>
              <p className="text-sm font-medium">
                No activity recorded in this workspace yet.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
