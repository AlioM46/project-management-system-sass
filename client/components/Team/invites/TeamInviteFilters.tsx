import { RefreshCw } from "lucide-react";

import { TeamInviteSearch } from "@/components/Team/invites/TeamInviteSearch";
import { Button } from "@/components/ui/button";
import { InviteStatus } from "@/features/team/types";
import { InviteFilterStatus } from "@/features/team/hooks/useWorkspaceInvites";

const statusOptions: Array<{ label: string; value: InviteFilterStatus }> = [
    { label: "All statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Expired", value: "expired" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Revoked", value: "revoked" },
];

type TeamInviteFiltersProps = {
    isRefreshing: boolean;
    onRefresh: () => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    setStatusFilter: (value: InviteFilterStatus) => void;
    statusFilter: InviteFilterStatus;
};

export function TeamInviteFilters({
    isRefreshing,
    onRefresh,
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    statusFilter,
}: TeamInviteFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
            <TeamInviteSearch value={searchQuery} onChange={setSearchQuery} />
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InviteStatus | "all")}
                className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
                {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-10 rounded-xl px-4"
            >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
            </Button>
        </div>
    );
}
