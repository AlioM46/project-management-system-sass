"use client";

import { BellOff, Users, Trash2, LogOut, Ban } from "lucide-react";

interface ChatInfoTabProps {
    conversation: any;
    isDirect: boolean;
    isProject: boolean;
    partner: any;
    groupsInCommon: any[];
    currentUserRole: string;
    onOpenClearModal: () => void;
    onOpenDeleteModal: () => void;
    onOpenBlockModal: () => void;
    onUnblockUser?: (userId: number) => Promise<void>;
    onOptimisticUnblock?: () => void;
}

export function ChatInfoTab({
    conversation,
    isDirect,
    isProject,
    partner,
    groupsInCommon,
    currentUserRole,
    onOpenClearModal,
    onOpenDeleteModal,
    onOpenBlockModal,
    onUnblockUser,
    onOptimisticUnblock,
}: ChatInfoTabProps) {
    return (
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5 scrollbar-thin">
            {/* Overview / Description */}
            {conversation?.description && (
                <div className="p-5">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Description</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {conversation.description}
                    </p>
                </div>
            )}

            {/* Groups in Common (Direct Messages only) */}
            {isDirect && (
                <div className="p-5 space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {groupsInCommon.length} Groups in Common
                    </h5>
                    {groupsInCommon.length === 0 ? (
                        <p className="text-xs text-zinc-400">No shared groups.</p>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                            {groupsInCommon.map((grp: any) => (
                                <div key={grp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{grp.name}</p>
                                        <p className="text-[10px] text-zinc-400 capitalize">{grp.type === "group" ? "Group" : `${grp.type} group`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions / Danger Zone */}
            <div className="p-5 space-y-1">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Actions</h5>

                {/* Clear Chat History */}
                <button
                    onClick={onOpenClearModal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                >
                    <Trash2 className="h-4 w-4 text-zinc-500 shrink-0" />
                    <span>Clear chat history</span>
                </button>

                {/* Block / Unblock Contact (Direct Messages only) */}
                {isDirect && partner && (
                    <button
                        onClick={async () => {
                            const partnerUserId = partner.id || partner.user_id;
                            if (conversation?.is_blocked_by_me) {
                                if (onUnblockUser) {
                                    if (onOptimisticUnblock) onOptimisticUnblock();
                                    try {
                                        await onUnblockUser(partnerUserId);
                                    } catch (err) {
                                        // Managed in parent hook
                                    }
                                }
                            } else {
                                onOpenBlockModal();
                            }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                        <Ban className="h-4 w-4 text-red-500 shrink-0" />
                        <span>{conversation?.is_blocked_by_me ? "Unblock User" : "Block User"}</span>
                    </button>
                )}

                {/* Delete / Leave Conversation */}
                {!isProject && (
                    <button
                        onClick={onOpenDeleteModal}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span>{isDirect ? "Delete chat" : currentUserRole === "owner" ? "Delete group" : "Leave group"}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
