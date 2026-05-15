"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FolderKanban, Users, CheckSquare, Clock, ArrowUpRight, BarChart3, TrendingUp } from "lucide-react";
import { getDashboardSummary, DashboardSummary } from "@/features/dashboard/api/dashboard.api";
import { getCookie } from "@/shared/utils/cookies";
import { formatDistanceToNow } from "date-fns";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";

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

    const stats = [
        {
            title: "Total Projects",
            value: summary?.stats.total_projects ?? 0,
            description: "Projects in this workspace",
            icon: FolderKanban,
            color: "text-blue-500",
        },
        {
            title: "Active Tasks",
            value: summary?.stats.active_tasks ?? 0,
            description: "Work in progress",
            icon: Activity,
            color: "text-amber-500",
        },
        {
            title: "Completed Tasks",
            value: summary?.stats.completed_tasks ?? 0,
            description: "Tasks marked as Done",
            icon: CheckSquare,
            color: "text-emerald-500",
        },
        {
            title: "Team Members",
            value: summary?.stats.total_members ?? 0,
            description: "Total collaborators",
            icon: Users,
            color: "text-purple-500",
        },
    ];

    // Prepare distribution data for chart
    const distributionData = summary?.task_distribution ? Object.entries(summary.task_distribution).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value
    })) : [];

    const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#71717a'];

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 bg-[#fafafa] dark:bg-[#050505] min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Workspace Analytics</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live metrics for <span className="font-semibold text-zinc-800 dark:text-zinc-200">Workspace #{workspaceId || "Unknown"}</span>
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="border-zinc-200/50 dark:border-white/5 dark:bg-[#0d0d0d] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-white/5`}>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="h-10 w-24 bg-zinc-100 dark:bg-white/5 animate-pulse rounded-lg" />
                                ) : (
                                    <div className="text-3xl font-black text-zinc-900 dark:text-white">{stat.value}</div>
                                )}
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 font-medium">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Performance Chart */}
                <Card className="col-span-4 border-zinc-200/50 dark:border-white/5 dark:bg-[#0d0d0d] shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                        <div>
                            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Performance Overview</CardTitle>
                            <p className="text-xs text-zinc-500 mt-1">Daily task completions (Last 7 days)</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <div className="h-full w-full bg-zinc-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={summary?.completions_chart}>
                                        <defs>
                                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#888', fontSize: 12}}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#888', fontSize: 12}}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0d0d0d', 
                                                border: '1px solid #ffffff10',
                                                borderRadius: '12px',
                                                fontSize: '12px'
                                            }}
                                            itemStyle={{ color: '#fff' }}
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

                {/* Status Distribution Chart */}
                <Card className="col-span-3 border-zinc-200/50 dark:border-white/5 dark:bg-[#0d0d0d] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Task Distribution</CardTitle>
                            <p className="text-xs text-zinc-500 mt-1">Current status breakdown</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <div className="h-full w-full bg-zinc-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#888', fontSize: 10}}
                                            width={80}
                                        />
                                        <Tooltip 
                                            cursor={{fill: '#ffffff05'}}
                                            contentStyle={{ 
                                                backgroundColor: '#0d0d0d', 
                                                border: '1px solid #ffffff10',
                                                borderRadius: '12px'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7 border-zinc-200/50 dark:border-white/5 dark:bg-[#0d0d0d] shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Recent Workspace Activity</CardTitle>
                        <ArrowUpRight className="h-5 w-5 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center space-x-4 animate-pulse p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02]">
                                        <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-white/10" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-20 bg-zinc-200 dark:bg-white/10 rounded" />
                                            <div className="h-3 w-full bg-zinc-200 dark:bg-white/10 rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : summary?.recent_activity && summary.recent_activity.length > 0 ? (
                                summary.recent_activity.map((log) => (
                                    <div key={log.id} className="flex items-center p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.02] hover:border-blue-500/30 transition-colors group">
                                        <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-xs font-black shadow-lg group-hover:scale-110 transition-transform">
                                            {log.actor_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="ml-4 space-y-0.5">
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                                                {log.actor_name}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold tracking-tighter">
                                                {log.event_type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                        <div className="ml-auto flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-200 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                {formatDistanceToNow(new Date(log.occurred_at), { addSuffix: false })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                                    <div className="p-4 rounded-full bg-zinc-100 dark:bg-white/5">
                                        <Activity className="h-10 w-10 text-zinc-300" />
                                    </div>
                                    <p className="text-sm font-medium">No activity recorded in this workspace yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
