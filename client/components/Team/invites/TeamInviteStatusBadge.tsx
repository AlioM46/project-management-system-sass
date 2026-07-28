import { InviteStatus } from "@/features/team/types";
import { getInviteStatusTone } from "@/features/team/utils/team-invite-formatters";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamInviteStatusBadgeProps = {
    isExpiringSoon?: boolean;
    status: InviteStatus;
};

export function TeamInviteStatusBadge({
    isExpiringSoon = false,
    status,
}: TeamInviteStatusBadgeProps) {
    const { t } = useTranslation();
    const statusKey = `team_invite_${status.toLowerCase()}` as any;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getInviteStatusTone(
                status
            )}`}
        >
            {isExpiringSoon && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            {t(statusKey) || status}
        </span>
    );
}
