import { RefObject } from "react";

import { TeamMemberActionsMenu } from "@/components/Team/members/TeamMemberActionsMenu";
import { TeamMemberIdentity } from "@/components/Team/members/TeamMemberIdentity";
import { TeamMemberRoleBadge } from "@/components/Team/members/TeamMemberRoleBadge";
import { Member } from "@/features/team/types";

type TeamMemberRowProps = {
    actionRef?: RefObject<HTMLDivElement | null>;
    currentUserId: string | null;
    isActionsOpen: boolean;
    member: Member;
    onCloseActions: () => void;
    onToggleActions: (memberId: string) => void;
    onChangeRole?: (member: Member) => void;
    onRemoveMember?: (member: Member) => void;
};

export function TeamMemberRow({
    actionRef,
    currentUserId,
    isActionsOpen,
    member,
    onCloseActions,
    onToggleActions,
    onChangeRole,
    onRemoveMember,
}: TeamMemberRowProps) {
    const roleName = member.role?.name || "member";

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

    const canPerformActions = !isSelf && !isOwner;

    return (
        <tr className="group transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
            <td className="px-6 py-4">
                <TeamMemberIdentity currentUserId={currentUserId} member={member} />
            </td>
            <td className="px-6 py-4">
                <TeamMemberRoleBadge roleName={roleName} />
            </td>
            <td className="px-6 py-4 text-zinc-500">
                {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Unknown"}
            </td>
            <td className="px-6 py-4 text-right">
                {canPerformActions ? (
                    <TeamMemberActionsMenu
                        actionRef={actionRef}
                        isOpen={isActionsOpen}
                        memberId={member.id}
                        onClose={onCloseActions}
                        onToggle={onToggleActions}
                        onChangeRole={() => onChangeRole?.(member)}
                        onRemoveMember={() => onRemoveMember?.(member)}
                    />
                ) : (
                    <span className="text-xs text-zinc-400 italic">
                        {isSelf ? "You" : "Owner"}
                    </span>
                )}
            </td>
        </tr>
    );
}
