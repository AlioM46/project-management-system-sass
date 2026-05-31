import { BarChart3 } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#71717a"];

type TaskDistributionCardProps = {
    isLoading: boolean;
    summary: DashboardSummary | null;
};

export function TaskDistributionCard({
    isLoading,
    summary,
}: TaskDistributionCardProps) {
    const distributionData = summary?.task_distribution
        ? Object.entries(summary.task_distribution).map(([name, value]) => ({
              name: name.replace("_", " "),
              value,
          }))
        : [];

    return (
        <Card className="col-span-3 border-zinc-200/50 shadow-sm dark:border-white/5 dark:bg-[#0d0d0d]">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                        Task Distribution
                    </CardTitle>
                    <p className="mt-1 text-xs text-zinc-500">Current status breakdown</p>
                </div>
                <BarChart3 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {isLoading ? (
                        <div className="h-full w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#88888820"
                                />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#888", fontSize: 10 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: "#ffffff05" }}
                                    contentStyle={{
                                        backgroundColor: "#0d0d0d",
                                        border: "1px solid #ffffff10",
                                        borderRadius: "12px",
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {distributionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
