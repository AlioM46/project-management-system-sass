"use client";

import { TeamInviteFilters } from "@/components/Team/invites/TeamInviteFilters";
import { TeamInviteStats } from "@/components/Team/invites/TeamInviteStats";
import { TeamInvitesEmptyState } from "@/components/Team/invites/TeamInvitesEmptyState";
import { TeamInvitesTable } from "@/components/Team/invites/TeamInvitesTable";
import { TeamSectionError } from "@/components/Team/TeamSectionError";
import { useWorkspaceInvites } from "@/features/team/hooks/useWorkspaceInvites";

export function TeamInvitesPanel() {
    const {
        cancellingInviteId,
        error,
        filteredInvites,
        invites,
        isLoading,
        refreshInvites,
        resendInvite,
        resendingInviteId,
        searchQuery,
        setSearchQuery,
        setStatusFilter,
        stats,
        statusFilter,
        cancelInvite,
    } = useWorkspaceInvites();

    const hasFilters = searchQuery.trim().length > 0 || statusFilter !== "all";

    return (
        <div className="space-y-6">
            <TeamInviteStats
                accepted={stats.accepted}
                expired={stats.expired}
                expiringSoon={stats.expiringSoon}
                pending={stats.pending}
                total={stats.total}
            />

            <TeamInviteFilters
                isRefreshing={isLoading}
                onRefresh={refreshInvites}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setStatusFilter={setStatusFilter}
                statusFilter={statusFilter}
            />

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading invites...</div>
                ) : error ? (
                    <div className="p-6">
                        <TeamSectionError title="Could not load invites" message={error} />
                    </div>
                ) : filteredInvites.length === 0 ? (
                    <TeamInvitesEmptyState hasFilters={hasFilters} hasInvites={invites.length > 0} />
                ) : (
                    <TeamInvitesTable
                        cancellingInviteId={cancellingInviteId}
                        invites={filteredInvites}
                        onCancel={cancelInvite}
                        onResend={resendInvite}
                        resendingInviteId={resendingInviteId}
                    />
                )}
            </div>
        </div>
    );
}
