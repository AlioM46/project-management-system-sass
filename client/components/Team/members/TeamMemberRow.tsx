import { RefObject } from "react";

import { TeamMemberActionsMenu } from "@/components/Team/members/TeamMemberActionsMenu";
import { TeamMemberIdentity } from "@/components/Team/members/TeamMemberIdentity";
import { TeamMemberRoleBadge } from "@/components/Team/members/TeamMemberRoleBadge";
import { Member } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamMemberRowProps = {
    actionRef?: RefObject<HTMLDivElement | null>;
    currentUserId: string | null;
    isActionsOpen: boolean;
    member: Member;
    onCloseActions: () => void;
    onToggleActions: (memberId: string) => void;
};

export function TeamMemberRow({
    actionRef,
    currentUserId,
    isActionsOpen,
    member,
    onCloseActions,
    onToggleActions,
}: TeamMemberRowProps) {
    const { t } = useTranslation();
    const roleName = member.role?.name || "member";

    return (
        <tr className="group transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
            <td className="px-6 py-4">
                <TeamMemberIdentity currentUserId={currentUserId} member={member} />
            </td>
            <td className="px-6 py-4">
                <TeamMemberRoleBadge roleName={roleName} />
            </td>
            <td className="px-6 py-4 text-zinc-500">
                {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : t("team_unknown_user")}
            </td>
            <td className="px-6 py-4 text-end">
                <TeamMemberActionsMenu
                    actionRef={actionRef}
                    isOpen={isActionsOpen}
                    memberId={member.id}
                    onClose={onCloseActions}
                    onToggle={onToggleActions}
                />
            </td>
        </tr>
    );
}
