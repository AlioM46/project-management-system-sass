import { Activity, ArrowUpRight } from "lucide-react";

import { RecentActivityItem } from "@/components/dashboard/RecentActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

type RecentActivityPanelProps = {
    isLoading: boolean;
    summary: DashboardSummary | null;
};

export function RecentActivityPanel({
    isLoading,
    summary,
}: RecentActivityPanelProps) {
    return (
        <Card className="col-span-7 border-zinc-200/50 shadow-sm dark:border-white/5 dark:bg-[#0d0d0d]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                    Recent Workspace Activity
                </CardTitle>
                <ArrowUpRight className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        [1, 2, 3].map((index) => (
                            <div
                                key={index}
                                className="flex animate-pulse items-center space-x-4 rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.02]"
                            >
                                <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-white/10" />
                                    <div className="h-3 w-full rounded bg-zinc-200 dark:bg-white/10" />
                                </div>
                            </div>
                        ))
                    ) : summary?.recent_activity && summary.recent_activity.length > 0 ? (
                        summary.recent_activity.map((log) => (
                            <RecentActivityItem key={log.id} log={log} />
                        ))
                    ) : (
                        <div className="col-span-3 flex flex-col items-center justify-center space-y-4 py-20 text-zinc-500">
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
