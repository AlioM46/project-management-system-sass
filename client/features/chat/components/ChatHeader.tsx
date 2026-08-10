"use client";

import { Hash, Users, Phone, Video, Search, Info } from "lucide-react";
import { getConversationName, getInitials } from "../utils/chatHelpers";

interface ChatHeaderProps {
    conversation: any | null;
    currentUserId: number;
    isUserOnline: (userId: number | undefined | null) => boolean;
    onToggleSearch?: () => void;
    isSearchOpen?: boolean;
    onToggleInfoSidebar?: () => void;
    isInfoSidebarOpen?: boolean;
}

export function ChatHeader({
    conversation,
    currentUserId,
    isUserOnline,
    onToggleSearch,
    isSearchOpen,
    onToggleInfoSidebar,
    isInfoSidebarOpen,
}: ChatHeaderProps) {
    if (!conversation) return null;

    const isGroup = conversation.type === "group";
    const isProject = conversation.type === "project";
    const isDirect = conversation.type === "direct";

    const partner = isDirect
        ? conversation.participants?.find((p: any) => (p.user_id || p.user?.id || p.id) !== currentUserId)?.user
        : null;

    const isOnline = partner ? isUserOnline(partner.id) : false;

    const displayName = getConversationName(conversation, currentUserId);
    const subtitle = isDirect
        ? isOnline
            ? "Online"
            : partner?.email || "Offline"
        : isProject
            ? "Project Channel"
            : `Group · ${conversation.participants?.length || 0} members`;

    return (
        <div className="h-16 border-b border-zinc-200 dark:border-white/10 px-6 flex items-center justify-between bg-white dark:bg-white/5 shrink-0">
            {/* Left: Avatar + Title & Subtitle */}
            <div
                onClick={onToggleInfoSidebar}
                className="flex items-center gap-3 cursor-pointer group/title"
            >
                <div className="relative">
                    {isProject ? (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            <Hash className="h-5 w-5" />
                        </div>
                    ) : isGroup ? (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                            <Users className="h-5 w-5" />
                        </div>
                    ) : partner?.avatar_url ? (
                        <img
                            src={partner.avatar_url}
                            alt={displayName}
                            className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {getInitials(displayName)}
                        </div>
                    )}

                    {isDirect && isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                        {displayName}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Right: Actions (Search & Info Sidebar Toggles) */}
            <div className="flex items-center gap-1">
                {onToggleSearch && (
                    <button
                        onClick={onToggleSearch}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${isSearchOpen
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400"
                            }`}
                        title="Search messages"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                )}

                {onToggleInfoSidebar && (
                    <button
                        onClick={onToggleInfoSidebar}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${isInfoSidebarOpen
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400"
                            }`}
                        title="Conversation Details"
                    >
                        <Info className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
