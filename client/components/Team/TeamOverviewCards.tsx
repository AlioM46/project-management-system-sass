import { Member } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamOverviewCardsProps = {
    members: Member[];
};

export function TeamOverviewCards({ members }: TeamOverviewCardsProps) {
    const { t } = useTranslation();
    const totalMembers = members.length;
    const owners = members.filter((member) => member.role?.name?.toLowerCase() === "owner").length;
    const admins = members.filter((member) => member.role?.name?.toLowerCase() === "admin").length;

    const cards = [
        { label: t("team_invite_total_members"), value: totalMembers },
        { label: t("team_invite_admins"), value: admins },
        { label: t("team_invite_owners"), value: owners },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
