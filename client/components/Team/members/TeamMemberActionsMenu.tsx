import { MoreHorizontal } from "lucide-react";
import { RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamMemberActionsMenuProps = {
    actionRef?: RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    memberId: string;
    onToggle: (memberId: string) => void;
    onClose: () => void;
};

export function TeamMemberActionsMenu({
    actionRef,
    isOpen,
    memberId,
    onToggle,
    onClose,
}: TeamMemberActionsMenuProps) {
    const { t } = useTranslation();

    return (
        <div
            ref={actionRef}
            className="relative inline-block text-start opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(memberId);
                }}
                className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div className="absolute top-full end-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white text-start shadow-lg dark:border-white/10 dark:bg-[#0f0f0f]">
                    <button
                        className="w-full px-4 py-2 text-start text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.info(t("team_toast_role_soon"));
                            onClose();
                        }}
                    >
                        {t("team_change_role")}
                    </button>
                    <button
                        className="w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.info(t("team_toast_remove_soon"));
                            onClose();
                        }}
                    >
                        {t("team_remove_member")}
                    </button>
                </div>
            )}
        </div>
    );
}
