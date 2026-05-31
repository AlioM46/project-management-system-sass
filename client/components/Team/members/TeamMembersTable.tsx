import { RefObject } from "react";

import { TeamMemberRow } from "@/components/Team/members/TeamMemberRow";
import { Member } from "@/features/team/types";

type TeamMembersTableProps = {
    actionRef: RefObject<HTMLDivElement | null>;
    currentUserId: string | null;
    members: Member[];
    openDropdownId: string | null;
    onCloseActions: () => void;
    onToggleActions: (memberId: string) => void;
};

export function TeamMembersTable({
    actionRef,
    currentUserId,
    members,
    openDropdownId,
    onCloseActions,
    onToggleActions,
}: TeamMembersTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    <tr>
                        <th className="rounded-tl-2xl px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="rounded-tr-2xl px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                    {members.map((member) => (
                        <TeamMemberRow
                            key={member.id}
                            actionRef={openDropdownId === member.id ? actionRef : undefined}
                            currentUserId={currentUserId}
                            isActionsOpen={openDropdownId === member.id}
                            member={member}
                            onCloseActions={onCloseActions}
                            onToggleActions={onToggleActions}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
