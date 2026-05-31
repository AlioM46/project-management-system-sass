import { Mail, ShieldAlert } from "lucide-react";

type TeamInvitesEmptyStateProps = {
    hasFilters: boolean;
    hasInvites: boolean;
};

export function TeamInvitesEmptyState({
    hasFilters,
    hasInvites,
}: TeamInvitesEmptyStateProps) {
    const title = !hasInvites
        ? "No invite history yet"
        : hasFilters
          ? "No invites match these filters"
          : "No pending invites";

    const description = !hasInvites
        ? "Send your first invitation to start building the workspace team."
        : hasFilters
          ? "Try another email or status filter to find the invitation you need."
          : "Everyone has either joined, expired, or been cancelled.";

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
