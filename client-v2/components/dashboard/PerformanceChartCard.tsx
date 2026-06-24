"use client";

import { CheckCircle2, TrendingUp } from "lucide-react";

import type { DashboardSummary } from "@/feature/dashboard/api/dashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PerformanceChartCardProps = {
  isLoading: boolean;
  summary: DashboardSummary | null;
};

function buildAreaPath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = height - (value / max) * height;
    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return area;
}

export default function PerformanceChartCard({
  isLoading,
  summary,
}: PerformanceChartCardProps) {
  const chartData = summary?.completions_chart ?? [];
  const completionDelta = summary?.summary.completion_delta ?? 0;
  const completedThisWeek = summary?.summary.tasks_completed_7d ?? 0;
  const createdThisWeek = summary?.summary.tasks_created_7d ?? 0;
  const chartHeight = 180;
  const chartWidth = 560;
  const completedValues = chartData.map((item) => item.completed);
  const createdValues = chartData.map((item) => item.created);
  const maxValue = Math.max(...completedValues, ...createdValues, 1);
  const areaPath = buildAreaPath(completedValues, chartWidth, chartHeight);

  return (
    <Card className="col-span-4 border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
      <CardHeader className="space-y-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
              Delivery Momentum
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Compare created tasks against completed work across the last 7
              days.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Completed
            </p>
            <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
              {isLoading ? "..." : completedThisWeek}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tasks finished in the current 7-day window.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Created
            </p>
            <p className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
              {isLoading ? "..." : createdThisWeek}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Incoming workload created over the same period.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Weekly Shift
            </p>
            <div className="mt-2 flex items-center gap-2 text-zinc-950 dark:text-white">
              <p className="text-3xl font-black">
                {isLoading ? "..." : `${completionDelta}%`}
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Change in completed tasks vs the previous 7 days.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-[1.75rem] border border-zinc-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.75))] p-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
          {isLoading ? (
            <div className="h-[320px] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Created
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Completed
                </span>
              </div>

              <div className="relative h-[260px]">
                <svg
                  viewBox={`0 0 ${chartWidth} 220`}
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="completedFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3].map((row) => {
                    const y = 20 + row * 50;
                    return (
                      <line
                        key={row}
                        x1="0"
                        y1={y}
                        x2={chartWidth}
                        y2={y}
                        stroke="currentColor"
                        className="text-zinc-200 dark:text-white/10"
                        strokeDasharray="4 6"
                      />
                    );
                  })}

                  <path d={areaPath} fill="url(#completedFill)" />

                  {chartData.map((item, index) => {
                    const slotWidth = chartWidth / chartData.length;
                    const barWidth = 34;
                    const barX = index * slotWidth + (slotWidth - barWidth) / 2;
                    const barHeight = (item.created / maxValue) * chartHeight;
                    const barY = 190 - barHeight;
                    const cx = index * slotWidth + slotWidth / 2;
                    const cy = 190 - (item.completed / maxValue) * chartHeight;

                    return (
                      <g key={item.date}>
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={Math.max(barHeight, 8)}
                          rx="12"
                          fill="#7dd3fc"
                          fillOpacity="0.9"
                        />
                        <circle cx={cx} cy={cy} r="5" fill="#10b981" />
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 gap-2 pt-4">
                  {chartData.map((item) => (
                    <div key={item.date} className="text-center">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {item.created}/{item.completed}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
