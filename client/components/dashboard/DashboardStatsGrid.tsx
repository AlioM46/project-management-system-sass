import {
    GraduationCap,
    Layers,
    LucideIcon,
    Users,
} from "lucide-react";

import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

type DashboardStatsGridProps = {
    isLoading: boolean;
    summary: DashboardSummary | null;
};

type StatConfig = {
    color: string;
    description: string;
    icon: LucideIcon;
    title: string;
    value: number;
};

import { useTranslation } from "@/lib/context/LanguageContext";

export function DashboardStatsGrid({ isLoading, summary }: DashboardStatsGridProps) {
    const { t } = useTranslation();

    const stats: StatConfig[] = [
        {
            title: t("db_courses_title"),
            value: summary?.stats.total_courses ?? 0,
            description: t("db_courses_desc"),
            icon: GraduationCap,
            color: "text-emerald-500",
        },
        {
            title: t("db_leads_title"),
            value: summary?.stats.total_leads ?? 0,
            description: t("db_leads_desc"),
            icon: Layers,
            color: "text-blue-500",
        },
        {
            title: t("db_members_title"),
            value: summary?.stats.total_members ?? 0,
            description: t("db_members_desc"),
            icon: Users,
            color: "text-amber-500",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
                <DashboardStatCard key={stat.title} isLoading={isLoading} {...stat} />
            ))}
        </div>
    );
}
