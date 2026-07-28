import { MoreHorizontal } from "lucide-react";
import { RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type TeamMemberActionsMenuProps = {
    actionRef?: RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    memberId: string;
    onToggle: (memberId: string) => void;
    onClose: () => void;
    onChangeRole?: () => void;
    onRemoveMember?: () => void;
};

export function TeamMemberActionsMenu({
    actionRef,
    isOpen,
    memberId,
    onToggle,
    onClose,
    onChangeRole,
    onRemoveMember,
}: TeamMemberActionsMenuProps) {
    return (
        <div
            ref={actionRef}
            className="relative inline-block text-left opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
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
                <div className="absolute top-full right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg dark:border-white/10 dark:bg-[#0f0f0f]">
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onChangeRole?.();
                        }}
                    >
                        Change Role
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onRemoveMember?.();
                        }}
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
}
