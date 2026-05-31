import { InviteStatus } from "@/features/team/types";
import { getInviteStatusTone } from "@/features/team/utils/team-invite-formatters";

type TeamInviteStatusBadgeProps = {
    isExpiringSoon?: boolean;
    status: InviteStatus;
};

export function TeamInviteStatusBadge({
    isExpiringSoon = false,
    status,
}: TeamInviteStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getInviteStatusTone(
                status
            )}`}
        >
            {isExpiringSoon && <span className="h-2 w-2 rounded-full bg-amber-500" />}
            {status}
        </span>
    );
}
