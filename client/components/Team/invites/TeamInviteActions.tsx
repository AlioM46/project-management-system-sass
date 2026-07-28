import { RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Invite } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamInviteActionsProps = {
    cancellingInviteId: number | null;
    invite: Invite;
    onCancel: (invitationId: number) => void;
    onResend: (invitationId: number) => void;
    resendingInviteId: number | null;
};

export function TeamInviteActions({
    cancellingInviteId,
    invite,
    onCancel,
    onResend,
    resendingInviteId,
}: TeamInviteActionsProps) {
    const { t } = useTranslation();
    const canCancel = invite.status === "pending";
    const canResend = invite.status === "pending" || invite.status === "expired" || invite.status === "cancelled";

    return (
        <div className="flex justify-end gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onResend(invite.id)}
                disabled={!canResend || resendingInviteId === invite.id}
                className="rounded-xl"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${resendingInviteId === invite.id ? "animate-spin" : ""}`} />
                {resendingInviteId === invite.id ? t("team_invite_resending") : t("team_invite_resend")}
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCancel(invite.id)}
                disabled={!canCancel || cancellingInviteId === invite.id}
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
            >
                <Trash2 className="h-3.5 w-3.5" />
                {cancellingInviteId === invite.id ? t("team_invite_cancelling") : t("team_invite_cancel")}
            </Button>
        </div>
    );
}
