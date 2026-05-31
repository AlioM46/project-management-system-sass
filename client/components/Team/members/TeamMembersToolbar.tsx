import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TeamMembersSearch } from "@/components/Team/members/TeamMembersSearch";

type TeamMembersToolbarProps = {
    isRefreshing: boolean;
    onRefresh: () => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
};

export function TeamMembersToolbar({
    isRefreshing,
    onRefresh,
    searchQuery,
    setSearchQuery,
}: TeamMembersToolbarProps) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
            <TeamMembersSearch value={searchQuery} onChange={setSearchQuery} />
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
