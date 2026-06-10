import { useTranslation } from "@/lib/context/LanguageContext";

type TeamInviteStatsProps = {
    accepted: number;
    expired: number;
    expiringSoon: number;
    pending: number;
    total: number;
};

const statCards = [
    {
        key: "total",
        translationKey: "team_invite_status_total",
        tone: "text-zinc-900 dark:text-white",
    },
    {
        key: "pending",
        translationKey: "team_invite_status_pending",
        tone: "text-blue-600 dark:text-blue-300",
    },
    {
        key: "expiringSoon",
        translationKey: "team_invite_status_expiring",
        tone: "text-amber-600 dark:text-amber-300",
    },
    {
        key: "accepted",
        translationKey: "team_invite_status_accepted",
        tone: "text-emerald-600 dark:text-emerald-300",
    },
    {
        key: "expired",
        translationKey: "team_invite_status_expired",
        tone: "text-red-600 dark:text-red-300",
    },
] as const;

export function TeamInviteStats({
    accepted,
    expired,
    expiringSoon,
    pending,
    total,
}: TeamInviteStatsProps) {
    const { t } = useTranslation();
    const values = { accepted, expired, expiringSoon, pending, total };

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => (
                <div
                    key={card.key}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        {t(card.translationKey as any)}
                    </p>
                    <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
                        {values[card.key]}
                    </p>
                </div>
            ))}
        </div>
    );
}
