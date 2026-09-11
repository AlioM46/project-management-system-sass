"use client";

import { useEffect, useState } from "react";

import { DashboardOverviewHeader } from "@/components/dashboard/DashboardOverviewHeader";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import { PerformanceChartCard } from "@/components/dashboard/PerformanceChartCard";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { TaskDistributionCard } from "@/components/dashboard/TaskDistributionCard";
import { getDashboardSummary, DashboardSummary } from "@/features/dashboard/api/dashboard.api";
import { useWorkspace } from "@/features/workspaces/hooks/useWorkspace";

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { currentWorkspace, currentWorkspaceId } = useWorkspace();

    useEffect(() => {
        setIsLoading(true);
        getDashboardSummary()
            .then(setSummary)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [currentWorkspaceId]);

    return (
        <div className="min-h-screen flex-1 space-y-8 bg-[#fafafa] p-8 pt-6 dark:bg-[#050505]">
            <DashboardOverviewHeader 
                workspaceId={currentWorkspaceId} 
                workspaceName={currentWorkspace?.name} 
            />
            <DashboardStatsGrid isLoading={isLoading} summary={summary} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <PerformanceChartCard isLoading={isLoading} summary={summary} />
                <TaskDistributionCard isLoading={isLoading} summary={summary} />
            </div>

        </div>
    );
}

