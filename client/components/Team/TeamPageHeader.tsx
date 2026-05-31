type TeamPageHeaderProps = {
    title?: string;
    description?: string;
};

export function TeamPageHeader({
    title = "Team",
    description = "Manage members and track workspace invitations.",
}: TeamPageHeaderProps) {
    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {title}
            </h2>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
    );
}
