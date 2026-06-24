"use client";

import { useEffect, useState } from "react";

import DashboardOverviewHeader from "@/components/dashboard/DashboardOverviewHeader";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import PerformanceChartCard from "@/components/dashboard/PerformanceChartCard";
import RecentActivityPanel from "@/components/dashboard/RecentActivityPanel";
import TaskDistributionCard from "@/components/dashboard/TaskDistributionCard";
import {
  type DashboardSummary,
  getDashboardSummary,
} from "@/feature/dashboard/api/dashboard.api";
import { getCookie } from "@/shared/utils/cookies";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const workspaceId = getCookie("workspace_id");

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex-1 space-y-8 bg-[linear-gradient(180deg,#f6f8fb_0%,#eef2f7_100%)] p-4 pt-4 dark:bg-[linear-gradient(180deg,#050505_0%,#090f19_100%)] md:p-8 md:pt-6">
      <DashboardOverviewHeader
        workspaceId={workspaceId}
        isLoading={isLoading}
        summary={summary}
      />

      <DashboardStatsGrid isLoading={isLoading} summary={summary} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <PerformanceChartCard isLoading={isLoading} summary={summary} />
        <TaskDistributionCard isLoading={isLoading} summary={summary} />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <RecentActivityPanel isLoading={isLoading} summary={summary} />
      </div>
    </div>
  );
}
