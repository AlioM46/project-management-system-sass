"use client";

import React from "react";
import { Hash, Users, BellOff, Pin, MoreVertical } from "lucide-react";
import { Conversation } from "../types";

interface ConversationSidebarItemProps {
    conv: any;
    isActive: boolean;
    currentUserId?: number;
    isOnline: boolean;
    isMenuOpen: boolean;
    typingUsers?: { id: number; name: string }[];
    getConversationName: (conv: any) => string;
    getInitials: (name: string) => string;
    formatTime: (timestamp?: string) => string;
    onSelect: () => void;
    onOpenMenu: (e: React.MouseEvent) => void;
}

export function ConversationSidebarItem({
    conv,
    isActive,
    currentUserId,
    isOnline,
    isMenuOpen,
    typingUsers = [],
    getConversationName,
    getInitials,
    formatTime,
    onSelect,
    onOpenMenu,
}: ConversationSidebarItemProps) {
    function getTypeIcon() {
        if (conv.type === "project") {
            return (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Hash className="h-4 w-4 text-white" />
                </div>
            );
        }
        if (conv.type === "group") {
            return (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Users className="h-4 w-4 text-white" />
                </div>
            );
        }
        const name = getConversationName(conv);
        return (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-bold text-white">{getInitials(name)}</span>
            </div>
        );
    }

    return (
        <div
            className="relative group/item"
            onContextMenu={onOpenMenu}
        >
            <button
                onClick={onSelect}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                        ? "bg-blue-50 dark:bg-blue-500/10"
                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                }`}
            >
                {/* Avatar */}
                <div className="relative">
                    {getTypeIcon()}
                    {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"}`}>
                            {getConversationName(conv)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {conv.is_pinned && <Pin className="h-3 w-3 fill-blue-500 text-blue-500 shrink-0" />}
                            {conv.is_muted && <BellOff className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />}
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {formatTime(conv.last_message?.created_at)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-2">
                            {isActive && typingUsers && typingUsers.length > 0 ? (
                                <span className="text-blue-500 font-semibold animate-pulse">
                                    typing...
                                </span>
                            ) : (
                                conv.last_message?.body
                            )}
                        </p>
                        {conv.unread_count > 0 && (
                            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                                {conv.unread_count}
                            </span>
                        )}
                    </div>
                </div>
            </button>

            {/* 3-Dots Action Button */}
            <button
                onClick={onOpenMenu}
                title="Conversation actions"
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all ${
                    isMenuOpen ? "flex text-zinc-700 dark:text-zinc-200" : "hidden group-hover/item:flex"
                }`}
            >
                <MoreVertical className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
