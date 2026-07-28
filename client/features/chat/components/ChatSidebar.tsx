"use client";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Search, Plus, Hash, Users, MessageCircle } from "lucide-react";
import { Conversation, User } from "../types";

interface ChatSidebarProps {
    conversations: any[];
    activeConversationId: number | null;
    onSelectConversation: (id: number) => void;
    onOpenNewConversationModal?: () => void;
    isUserOnline: (userId: number | undefined | null) => boolean
}

export function ChatSidebar({ conversations, activeConversationId, onSelectConversation, onOpenNewConversationModal, isUserOnline }: ChatSidebarProps) {
    // Helper: Get display name for a conversation
    const { currentUser, isLoading } = useCurrentUser();

    function getConversationName(conv: any): string {
        // Project
        if (conv.type === "project" && conv.project) {
            return conv.project.name;
        }
        // Group
        if (conv.name) return conv.name;

        // DM: show the other person's name
        if (conv.participants?.[0]?.user?.id !== currentUser?.id && conv.participants?.[0]?.user?.name) {
            return conv.participants[0].user.name;
        } else if (conv.participants?.[1]?.user?.id !== currentUser?.id && conv.participants?.[1]?.user?.name) {
            return conv.participants[1].user.name;
        }
        return "Unknown";
    }

    // Helper: Get initials from a name
    function getInitials(name: string): string {
        return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    }

    // Helper: Format message timestamp
    function formatTime(timestamp?: string): string {
        if (!timestamp) return "";
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return "";
        }
    }

    // Helper: Get icon/color for conversation type
    function getTypeIcon(conv: any) {
        // Project
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
        // DM: show avatar initials
        const name = getConversationName(conv);
        return (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-bold text-white">{getInitials(name)}</span>
            </div>
        );
    }

    function getParticipantAvatar(conv: Conversation) {

    }

    return (
        <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Messages</h2>
                </div>
                <button onClick={onOpenNewConversationModal} className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm">
                    <Plus className="h-4 w-4 text-white" />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-100 dark:bg-white/5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
                {/* DMs Section */}
                <div className="mb-1">
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
                        Direct Messages
                    </p>
                    {conversations
                        ?.filter((c) => c.type === "direct")
                        .map((conv) => {
                            const partner = conv.participants.find((participant: any) => participant?.user?.id != currentUser?.id)
                            const isActive = conv.id === activeConversationId;

                            const isOnline = partner?.user?.id ? isUserOnline(partner.user.id) : false;

                            // const isUserOnline = isUserOnline(conv.user?.id)
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10"
                                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        {getTypeIcon(conv)}
                                        {/* Online indicator */}
                                        {isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium truncate ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"
                                                }`}>
                                                {getConversationName(conv)}
                                            </span>
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                                                {formatTime(conv.last_message?.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-2">
                                                {conv.last_message?.body}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Groups Section */}
                <div className="mb-1 mt-2">
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
                        Groups
                    </p>
                    {conversations
                        ?.filter((c) => c.type === "group")
                        .map((conv) => {
                            const isActive = conv.id === activeConversationId;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10"
                                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {getTypeIcon(conv)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium truncate ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"
                                                }`}>
                                                {getConversationName(conv)}
                                            </span>
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                                                {formatTime(conv.last_message?.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-2">
                                                {conv.last_message?.body}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Projects Section */}
                <div className="mt-2">
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
                        Project Channels
                    </p>
                    {conversations
                        ?.filter((c) => c.type === "project")
                        .map((conv) => {
                            const isActive = conv.id === activeConversationId;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                                        ? "bg-blue-50 dark:bg-blue-500/10"
                                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    {getTypeIcon(conv)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium truncate ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-white"
                                                }`}>
                                                {getConversationName(conv)}
                                            </span>
                                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                                                {formatTime(conv.last_message?.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-2">
                                                {conv.last_message?.body}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
