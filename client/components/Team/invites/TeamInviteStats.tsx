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
        label: "Total invites",
        tone: "text-zinc-900 dark:text-white",
    },
    {
        key: "pending",
        label: "Pending",
        tone: "text-blue-600 dark:text-blue-300",
    },
    {
        key: "expiringSoon",
        label: "Expiring soon",
        tone: "text-amber-600 dark:text-amber-300",
    },
    {
        key: "accepted",
        label: "Accepted",
        tone: "text-emerald-600 dark:text-emerald-300",
    },
    {
        key: "expired",
        label: "Expired",
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
    const values = { accepted, expired, expiringSoon, pending, total };

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => (
                <div
                    key={card.key}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0a0a0a]"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        {card.label}
                    </p>
                    <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
                        {values[card.key]}
                    </p>
                </div>
            ))}
        </div>
    );
}
