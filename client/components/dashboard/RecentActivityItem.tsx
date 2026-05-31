import { formatDistanceToNow } from "date-fns";

import { DashboardSummary } from "@/features/dashboard/api/dashboard.api";

type RecentActivityItemProps = {
    log: DashboardSummary["recent_activity"][number];
};

export function RecentActivityItem({ log }: RecentActivityItemProps) {
    return (
        <div className="group flex items-center rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-colors hover:border-blue-500/30 dark:border-white/[0.02] dark:bg-white/[0.02]">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow-lg transition-transform group-hover:scale-110">
                {log.actor_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="ml-4 space-y-0.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{log.actor_name}</p>
                <p className="text-xs font-semibold uppercase tracking-tighter text-zinc-500 dark:text-zinc-500">
                    {log.event_type.replace(/_/g, " ")}
                </p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
                <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:bg-white/5">
                    {formatDistanceToNow(new Date(log.occurred_at), { addSuffix: false })}
                </span>
            </div>
        </div>
    );
}
