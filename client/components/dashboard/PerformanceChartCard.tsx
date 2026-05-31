import { TrendingUp } from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

type PerformanceChartCardProps = {
    isLoading: boolean;
    summary: DashboardSummary | null;
};

export function PerformanceChartCard({
    isLoading,
    summary,
}: PerformanceChartCardProps) {
    return (
        <Card className="col-span-4 overflow-hidden border-zinc-200/50 shadow-sm dark:border-white/5 dark:bg-[#0d0d0d]">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                        Performance Overview
                    </CardTitle>
                    <p className="mt-1 text-xs text-zinc-500">
                        Daily task completions (Last 7 days)
                    </p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {isLoading ? (
                        <div className="h-full w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary?.completions_chart}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#88888820"
                                />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#888", fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#888", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0d0d0d",
                                        border: "1px solid #ffffff10",
                                        borderRadius: "12px",
                                        fontSize: "12px",
                                    }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCompleted)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
