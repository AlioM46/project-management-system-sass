import { TeamInviteRow } from "@/components/Team/invites/TeamInviteRow";
import { Invite } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

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
    const { t } = useTranslation();

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    <tr>
                        <th className="rounded-ss-2xl px-6 py-4">{t("team_invite_col_invitee")}</th>
                        <th className="px-6 py-4">{t("team_invite_col_status")}</th>
                        <th className="px-6 py-4">{t("team_invite_col_sent")}</th>
                        <th className="px-6 py-4">{t("team_invite_col_expires")}</th>
                        <th className="px-6 py-4">{t("team_invite_col_message")}</th>
                        <th className="rounded-se-2xl px-6 py-4 text-end">{t("team_invite_col_action")}</th>
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
