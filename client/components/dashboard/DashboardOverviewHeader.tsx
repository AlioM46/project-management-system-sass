type DashboardOverviewHeaderProps = {
    workspaceId: string | undefined;
};

export function DashboardOverviewHeader({ workspaceId }: DashboardOverviewHeaderProps) {
    return (
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Workspace Analytics
                </h2>
                <p className="mt-1 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live metrics for{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        Workspace #{workspaceId || "Unknown"}
                    </span>
                </p>
            </div>
        </div>
    );
}
