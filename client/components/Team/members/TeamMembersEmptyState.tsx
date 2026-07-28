import { ShieldAlert } from "lucide-react";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamMembersEmptyStateProps = {
    hasSearchQuery: boolean;
};

export function TeamMembersEmptyState({ hasSearchQuery }: TeamMembersEmptyStateProps) {
    const { t } = useTranslation();

    return (
        <div className="flex p-16 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
                <ShieldAlert className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {hasSearchQuery ? t("team_empty_no_match") : t("team_empty_none")}
            </h3>
            <p className="mt-2 max-w-sm text-zinc-500">
                {hasSearchQuery
                    ? t("team_empty_no_match_desc")
                    : t("team_empty_none_desc")}
            </p>
        </div>
    );
}
