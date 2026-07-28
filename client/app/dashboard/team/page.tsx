"use client";

import { useState } from "react";

import InviteMember from "@/components/Team/InviteMember";
import { TeamOverviewCards } from "@/components/Team/TeamOverviewCards";
import { TeamPageHeader } from "@/components/Team/TeamPageHeader";
import { TeamPrimaryActions } from "@/components/Team/TeamPrimaryActions";
import { TeamTabs } from "@/components/Team/TeamTabs";
import { TeamInvitesPanel } from "@/components/Team/invites/TeamInvitesPanel";
import { TeamMembersPanel } from "@/components/Team/members/TeamMembersPanel";
import { useTeamMembers } from "@/features/team/hooks/useTeamMembers";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function TeamPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"members" | "invites">("members");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const { currentUserId, error, isLoading, members, refreshMembers } = useTeamMembers();

    return (
        <>
            <div className="flex-1 space-y-8 p-8 pt-6 text-start">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TeamPageHeader title={t("team_title")} description={t("team_subtitle")} />
                    <TeamPrimaryActions
                        isRefreshing={isLoading && activeTab === "members"}
                        onInvite={() => setIsInviteOpen(true)}
                        onRefresh={activeTab === "members" ? refreshMembers : undefined}
                    />
                </div>

                <TeamOverviewCards members={members} />

                <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
                    <TeamTabs activeTab={activeTab} onChange={setActiveTab} />
                </div>

                {activeTab === "members" ? (
                    <TeamMembersPanel
                        currentUserId={currentUserId}
                        error={error}
                        isLoading={isLoading}
                        members={members}
                        onRefresh={refreshMembers}
                    />
                ) : (
                    <TeamInvitesPanel />
                )}
            </div>

            <InviteMember open={isInviteOpen} onOpenChange={setIsInviteOpen} />
        </>
    );
}
