"use client";

import { useEffect, useRef, useState } from "react";

import { TeamMembersEmptyState } from "@/components/Team/members/TeamMembersEmptyState";
import { TeamMembersTable } from "@/components/Team/members/TeamMembersTable";
import { TeamMembersToolbar } from "@/components/Team/members/TeamMembersToolbar";
import { TeamSectionError } from "@/components/Team/TeamSectionError";
import { Member } from "@/features/team/types";

type TeamMembersPanelProps = {
    currentUserId: string | null;
    error: string | null;
    isLoading: boolean;
    members: Member[];
    onRefresh: () => void;
};

export function TeamMembersPanel({
    currentUserId,
    error,
    isLoading,
    members,
    onRefresh,
}: TeamMembersPanelProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const actionsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsRef.current?.contains(event.target as Node)) {
                return;
            }

            setOpenDropdownId(null);
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const filteredMembers = members.filter(
        (member) =>
            member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <TeamMembersToolbar
                isRefreshing={isLoading}
                onRefresh={onRefresh}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading members...</div>
                ) : error ? (
                    <div className="p-6">
                        <TeamSectionError title="Could not load members" message={error} />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <TeamMembersEmptyState hasSearchQuery={searchQuery.trim().length > 0} />
                ) : (
                    <TeamMembersTable
                        actionRef={actionsRef}
                        currentUserId={currentUserId}
                        members={filteredMembers}
                        openDropdownId={openDropdownId}
                        onCloseActions={() => setOpenDropdownId(null)}
                        onToggleActions={(memberId) =>
                            setOpenDropdownId((currentId) => (currentId === memberId ? null : memberId))
                        }
                    />
                )}
            </div>
        </div>
    );
}
