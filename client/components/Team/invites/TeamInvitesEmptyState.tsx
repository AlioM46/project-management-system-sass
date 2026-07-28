import { Mail, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamInvitesEmptyStateProps = {
    hasFilters: boolean;
    hasInvites: boolean;
};

export function TeamInvitesEmptyState({
    hasFilters,
    hasInvites,
}: TeamInvitesEmptyStateProps) {
    const { t } = useTranslation();

    const title = !hasInvites
        ? t("team_invite_empty_no_history")
        : hasFilters
          ? t("team_invite_empty_no_match")
          : t("team_invite_empty_no_pending");

    const description = !hasInvites
        ? t("team_invite_empty_desc_no_history")
        : hasFilters
          ? t("team_invite_empty_desc_no_match")
          : t("team_invite_empty_desc_no_pending");

    const Icon = !hasInvites ? Mail : ShieldAlert;

    return (
        <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
                <Icon className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
            <p className="mt-2 max-w-sm text-zinc-500">{description}</p>
        </div>
    );
}
