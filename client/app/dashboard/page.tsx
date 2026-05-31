"use client";

import { useEffect, useState } from "react";

import { DashboardOverviewHeader } from "@/components/dashboard/DashboardOverviewHeader";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { PerformanceChartCard } from "@/components/dashboard/PerformanceChartCard";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { TaskDistributionCard } from "@/components/dashboard/TaskDistributionCard";
import { getDashboardSummary, DashboardSummary } from "@/features/dashboard/api/dashboard.api";
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
        <div className="min-h-screen flex-1 space-y-8 bg-[#fafafa] p-8 pt-6 dark:bg-[#050505]">
            <DashboardOverviewHeader workspaceId={workspaceId} />
            <DashboardStatsGrid isLoading={isLoading} summary={summary} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <PerformanceChartCard isLoading={isLoading} summary={summary} />
                <TaskDistributionCard isLoading={isLoading} summary={summary} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <RecentActivityPanel isLoading={isLoading} summary={summary} />
            </div>
        </div>
    );
}
