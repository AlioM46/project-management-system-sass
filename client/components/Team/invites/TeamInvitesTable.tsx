import { TeamInviteRow } from "@/components/Team/invites/TeamInviteRow";
import { Invite } from "@/features/team/types";

type TeamInvitesTableProps = {
    cancellingInviteId: number | null;
    invites: Invite[];
    onCancel: (invitationId: number) => void;
    onResend: (invitationId: number) => void;
    resendingInviteId: number | null;
};

export function TeamInvitesTable({
    cancellingInviteId,
    invites,
    onCancel,
    onResend,
    resendingInviteId,
}: TeamInvitesTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    <tr>
                        <th className="rounded-tl-2xl px-6 py-4">Invitee</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Sent</th>
                        <th className="px-6 py-4">Expires</th>
                        <th className="px-6 py-4">Message</th>
                        <th className="rounded-tr-2xl px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                    {invites.map((invite) => (
                        <TeamInviteRow
                            key={invite.id}
                            cancellingInviteId={cancellingInviteId}
                            invite={invite}
                            onCancel={onCancel}
                            onResend={onResend}
                            resendingInviteId={resendingInviteId}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
