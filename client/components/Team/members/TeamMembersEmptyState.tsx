import { ShieldAlert } from "lucide-react";

type TeamMembersEmptyStateProps = {
    hasSearchQuery: boolean;
};

export function TeamMembersEmptyState({ hasSearchQuery }: TeamMembersEmptyStateProps) {
    return (
        <div className="flex p-16 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
                <ShieldAlert className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {hasSearchQuery ? "No matching members" : "No members found"}
            </h3>
            <p className="mt-2 max-w-sm text-zinc-500">
                {hasSearchQuery
                    ? "Try a different search term to find the teammate you need."
                    : "Invite your teammates to collaborate in this workspace."}
            </p>
        </div>
    );
}
