import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardStatCardProps = {
    color: string;
    description: string;
    icon: LucideIcon;
    isLoading: boolean;
    title: string;
    value: number;
};

export function DashboardStatCard({
    color,
    description,
    icon: Icon,
    isLoading,
    title,
    value,
}: DashboardStatCardProps) {
    return (
        <Card className="border-zinc-200/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-[#0d0d0d]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {title}
                </CardTitle>
                <div className="rounded-lg bg-zinc-100 p-2 dark:bg-white/5">
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-10 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-white/5" />
                ) : (
                    <div className="text-3xl font-black text-zinc-900 dark:text-white">{value}</div>
                )}
                <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
