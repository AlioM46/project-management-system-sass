import { RefreshCw, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

type TeamPrimaryActionsProps = {
    onInvite: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
};

export function TeamPrimaryActions({
    onInvite,
    onRefresh,
    isRefreshing = false,
}: TeamPrimaryActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {onRefresh && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-11 rounded-2xl px-4"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            )}
            <Button
                type="button"
                onClick={onInvite}
                className="h-11 rounded-2xl px-5 shadow-md shadow-blue-950/10"
            >
                <UserPlus className="h-4 w-4" />
                Invite Member
            </Button>
        </div>
    );
}
