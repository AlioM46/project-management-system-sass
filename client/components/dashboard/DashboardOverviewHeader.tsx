import { useTranslation } from "@/lib/context/LanguageContext";

type DashboardOverviewHeaderProps = {
    workspaceId: string | null | undefined;
};

export function DashboardOverviewHeader({ workspaceId }: DashboardOverviewHeaderProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between space-y-2 text-start">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    {t("db_title")}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500 shrink-0" />
                    {t("db_subtitle")}
                </p>
            </div>
        </div>
    );
}
