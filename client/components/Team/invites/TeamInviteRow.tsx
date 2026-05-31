import { Clock3, Send } from "lucide-react";

import { TeamInviteActions } from "@/components/Team/invites/TeamInviteActions";
import { TeamInviteStatusBadge } from "@/components/Team/invites/TeamInviteStatusBadge";
import { Invite } from "@/features/team/types";
import {
    formatExpiryHoursLabel,
    formatInviteDateTime,
    formatSentHoursLabel,
    isInviteExpiringSoon,
} from "@/features/team/utils/team-invite-formatters";

type TeamInviteRowProps = {
    cancellingInviteId: number | null;
    invite: Invite;
    onCancel: (invitationId: number) => void;
    onResend: (invitationId: number) => void;
    resendingInviteId: number | null;
};

export function TeamInviteRow({
    cancellingInviteId,
    invite,
    onCancel,
    onResend,
    resendingInviteId,
}: TeamInviteRowProps) {
    const expiringSoon = isInviteExpiringSoon(invite);

    return (
        <tr className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white">
                        <Send className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{invite.email}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            {invite.role?.name ?? "Role unavailable"}
                            {invite.inviter?.name ? ` • Invited by ${invite.inviter.name}` : ""}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <TeamInviteStatusBadge isExpiringSoon={expiringSoon} status={invite.status} />
            </td>
            <td className="px-6 py-4 text-zinc-500">
                <div className="inline-flex flex-col gap-1">
                    <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatInviteDateTime(invite.sent_at)}
                    </span>
                    <span className="text-xs text-zinc-400">{formatSentHoursLabel(invite.sent_at)}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-zinc-500">
                <div className="flex flex-col gap-1">
                    <span>{formatInviteDateTime(invite.expires_at)}</span>
                    <span className={`text-xs ${expiringSoon ? "text-amber-500" : "text-zinc-400"}`}>
                        {formatExpiryHoursLabel(invite.expires_at)}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4 text-zinc-500">
                {invite.message ? (
                    <span className="line-clamp-2 max-w-xs">{invite.message}</span>
                ) : (
                    <span className="text-zinc-400">No message</span>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                <TeamInviteActions
                    cancellingInviteId={cancellingInviteId}
                    invite={invite}
                    onCancel={onCancel}
                    onResend={onResend}
                    resendingInviteId={resendingInviteId}
                />
            </td>
        </tr>
    );
}
