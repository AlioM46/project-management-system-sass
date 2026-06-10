import { Member } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamMemberIdentityProps = {
    currentUserId: string | null;
    member: Member;
};

export function TeamMemberIdentity({ currentUserId, member }: TeamMemberIdentityProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white">
                {member.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
                <p className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                    {member.user?.name || t("team_unknown_user")}
                    {currentUserId === member.user_id && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            {t("team_you")}
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{member.user?.email || t("team_no_email")}</p>
            </div>
        </div>
    );
}
