// client/features/billing/components/UsageMeters.tsx
"use client";

import React from "react";
import { Users, FolderKanban, ShieldCheck, HardDrive } from "lucide-react";
import { UsageSummary } from "../types";

interface UsageMetersProps {
    usage: UsageSummary;
}

interface MeterItemProps {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    current: number;
    max: number | null;
    unit?: string;
    customCurrentDisplay?: string;
}

function getProgressColor(percentage: number | null): string {
    if (percentage === null) return "bg-blue-600 dark:bg-blue-500";
    if (percentage >= 90) return "bg-rose-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-blue-600 dark:bg-blue-500";
}

function MeterItem({ label, icon: Icon, current, max, unit = "", customCurrentDisplay }: MeterItemProps) {
    const isUnlimited = max === null;
    const percentage = isUnlimited || max === 0 ? 0 : Math.min(100, Math.round((current / max) * 100));
    const progressColor = getProgressColor(isUnlimited ? null : percentage);

    const formattedCurrent = customCurrentDisplay || (unit ? `${current.toLocaleString()} ${unit}` : current.toLocaleString());
    const formattedMax = max !== null ? (unit ? `${max.toLocaleString()} ${unit}` : max.toLocaleString()) : "Unlimited";

    return (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/10 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 shadow-xs">
                        <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span>{label}</span>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white font-mono">
                    {formattedCurrent} {isUnlimited ? "/ Unlimited" : `/ ${formattedMax}`}
                </span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: isUnlimited ? "10%" : `${Math.max(3, percentage)}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{isUnlimited ? "Unlimited allowance" : `${percentage}% used`}</span>
                {!isUnlimited && percentage >= 90 && (
                    <span className="text-rose-500 font-medium animate-pulse">Near limit</span>
                )}
            </div>
        </div>
    );
}

export function UsageMeters({ usage }: UsageMetersProps) {
    const storageDisplay = usage.storage_mb.current_formatted
        ? usage.storage_mb.current_formatted
        : usage.storage_mb.current > 0
        ? `${usage.storage_mb.current} MB`
        : "0 MB";

    return (
        <div className="bg-white dark:bg-[#0e0e10] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Resource Usage
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Live consumption of team members, projects, roles, and storage included in your active plan.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MeterItem
                    label="Team Members"
                    icon={Users}
                    current={usage.members.current}
                    max={usage.members.max}
                />
                <MeterItem
                    label="Projects"
                    icon={FolderKanban}
                    current={usage.projects.current}
                    max={usage.projects.max}
                />
                <MeterItem
                    label="Custom Roles"
                    icon={ShieldCheck}
                    current={usage.custom_roles.current}
                    max={usage.custom_roles.max}
                />
                <MeterItem
                    label="File Storage"
                    icon={HardDrive}
                    current={usage.storage_mb.current}
                    max={usage.storage_mb.max}
                    unit="MB"
                    customCurrentDisplay={storageDisplay}
                />
            </div>
        </div>
    );
}
