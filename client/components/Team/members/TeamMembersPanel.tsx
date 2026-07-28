"use client";

import { useEffect, useRef, useState } from "react";

import { TeamMembersEmptyState } from "@/components/Team/members/TeamMembersEmptyState";
import { TeamMembersTable } from "@/components/Team/members/TeamMembersTable";
import { TeamMembersToolbar } from "@/components/Team/members/TeamMembersToolbar";
import { TeamSectionError } from "@/components/Team/TeamSectionError";
import { toast } from "sonner";
import { removeMember } from "@/features/team/api/team.api";
import { getErrorMessage } from "@/shared/api/ApiError";
import { ChangeMemberRoleModal } from "@/components/modals/ChangeMemberRoleModal";
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
    const [selectedMemberForRole, setSelectedMemberForRole] = useState<Member | null>(null);
    const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
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

    const isSelfOrOwner = (member: Member) => {
        const isSelf = Boolean(
            currentUserId && (
                String(currentUserId) === String(member.user_id) ||
                String(currentUserId) === String(member.user?.id)
            )
        );
        const isOwner = Boolean(
            member.role?.slug === "owner" ||
            member.role?.name?.toLowerCase() === "owner"
        );
        return { isSelf, isOwner };
    };

    const handleChangeRole = (member: Member) => {
        const { isSelf, isOwner } = isSelfOrOwner(member);
        if (isSelf) {
            toast.error("You cannot change your own role.");
            return;
        }
        if (isOwner) {
            toast.error("Role cannot be changed for the workspace owner.");
            return;
        }

        setSelectedMemberForRole(member);
        setIsChangeRoleOpen(true);
    };

    const handleRemoveMember = async (member: Member) => {
        const { isSelf, isOwner } = isSelfOrOwner(member);
        if (isSelf) {
            toast.error("You cannot remove yourself from the team.");
            return;
        }
        if (isOwner) {
            toast.error("The workspace owner cannot be removed.");
            return;
        }

        const memberName = member.user?.name || member.user?.email || "this member";
        if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
            return;
        }

        try {
            await removeMember(member.id);
            toast.success(`${memberName} has been removed from the workspace.`);
            onRefresh();
        } catch (err) {
            console.error("Failed to remove member", err);
            toast.error(getErrorMessage(err, "Failed to remove workspace member."));
        }
    };

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
                        onChangeRole={handleChangeRole}
                        onRemoveMember={handleRemoveMember}
                    />
                )}
            </div>

            <ChangeMemberRoleModal
                member={selectedMemberForRole}
                open={isChangeRoleOpen}
                onOpenChange={setIsChangeRoleOpen}
                onSuccess={onRefresh}
            />
        </div>
    );
}
