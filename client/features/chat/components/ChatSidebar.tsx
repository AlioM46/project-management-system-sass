"use client";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Search, Plus, MessageCircle, Pin } from "lucide-react";
import { Conversation } from "../types";
import { togglePinConversation } from "../api/chat.api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ConversationSidebarItem } from "./ConversationSidebarItem";

interface ChatSidebarProps {
    conversations: any[];
    activeConversationId: number | null;
    onSelectConversation: (id: number) => void;
    onOpenNewConversationModal?: () => void;
    onOpenStarredTab?: () => void;
    isUserOnline: (userId: number | undefined | null) => boolean;
    typingUsers?: { id: number; name: string }[];
    onRefreshConversations?: () => void;
}

export function ChatSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    onOpenNewConversationModal,
    onOpenStarredTab,
    isUserOnline,
    typingUsers = [],
    onRefreshConversations,
}: ChatSidebarProps) {
    const { currentUser } = useCurrentUser();
    const [menuState, setMenuState] = useState<{
        convId: number;
        top: number;
        left: number;
        placeAbove: boolean;
    } | null>(null);

    useEffect(() => {
        const handleClose = () => setMenuState(null);
        window.addEventListener("click", handleClose);
        window.addEventListener("scroll", handleClose, true);
        return () => {
            window.removeEventListener("click", handleClose);
            window.removeEventListener("scroll", handleClose, true);
        };
    }, []);

    function getConversationName(conv: any): string {
        if (conv.type === "project" && conv.project) {
            return conv.project.name;
        }
        if (conv.name) return conv.name;

        if (conv.participants?.[0]?.user?.id !== currentUser?.id && conv.participants?.[0]?.user?.name) {
            return conv.participants[0].user.name;
        } else if (conv.participants?.[1]?.user?.id !== currentUser?.id && conv.participants?.[1]?.user?.name) {
            return conv.participants[1].user.name;
        }
        return "Unknown";
    }

    function getInitials(name: string): string {
        return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    }

    function formatTime(timestamp?: string): string {
        if (!timestamp) return "";
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "";
        }
    }

    const handleTogglePin = async (e: React.MouseEvent, conversationId: number) => {
        e.stopPropagation();
        try {
            const res = await togglePinConversation(conversationId);
            toast.success(res.is_pinned ? "Conversation pinned to top" : "Conversation unpinned");
            if (onRefreshConversations) {
                onRefreshConversations();
            }
        } catch {
            toast.error("Failed to update pinned conversation");
        }
    };

    const handleOpenMenu = (e: React.MouseEvent, convId: number) => {
        e.stopPropagation();
        e.preventDefault();

        if (menuState?.convId === convId) {
            setMenuState(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const placeAbove = spaceBelow < 120;

        setMenuState({
            convId,
            top: placeAbove ? rect.top : rect.bottom,
            left: Math.max(10, rect.right - 180),
            placeAbove,
        });
    };

    const renderSidebarItem = (conv: any) => {
        const isActive = conv.id === activeConversationId;
        const partner = conv.participants?.find((p: any) => p?.user?.id !== currentUser?.id);
        const isOnline = conv.type === "direct" && partner?.user?.id ? isUserOnline(partner.user.id) : false;
        const isMenuOpen = menuState?.convId === conv.id;

        return (
            <ConversationSidebarItem
                key={conv.id}
                conv={conv}
                isActive={isActive}
                currentUserId={currentUser?.id}
                isOnline={isOnline}
                isMenuOpen={isMenuOpen}
                typingUsers={typingUsers}
                getConversationName={getConversationName}
                getInitials={getInitials}
                formatTime={formatTime}
                onSelect={() => onSelectConversation(conv.id)}
                onOpenMenu={(e) => handleOpenMenu(e, conv.id)}
            />
        );
    };

    const pinnedConversations = conversations?.filter((c) => c.is_pinned) || [];
    const directConversations = conversations?.filter((c) => c.type === "direct" && !c.is_pinned) || [];
    const groupConversations = conversations?.filter((c) => c.type === "group" && !c.is_pinned) || [];
    const projectConversations = conversations?.filter((c) => c.type === "project" && !c.is_pinned) || [];

    return (
        <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex flex-col relative">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Messages</h2>
                </div>
                <button onClick={onOpenNewConversationModal} title="New Chat" className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm">
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
                {/* 📌 Pinned Section */}
                {pinnedConversations.length > 0 && (
                    <div className="mb-3">
                        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                            <Pin className="h-3 w-3 fill-blue-500/20" />
                            <span>Pinned ({pinnedConversations.length})</span>
                        </p>
                        {pinnedConversations.map(renderSidebarItem)}
                    </div>
                )}

                {/* DMs Section */}
                {directConversations.length > 0 && (
                    <div className="mb-2">
                        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-1.5">
                            Direct Messages
                        </p>
                        {directConversations.map(renderSidebarItem)}
                    </div>
                )}

                {/* Groups Section */}
                {groupConversations.length > 0 && (
                    <div className="mb-2">
                        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-1.5">
                            Groups
                        </p>
                        {groupConversations.map(renderSidebarItem)}
                    </div>
                )}

                {/* Projects Section */}
                {projectConversations.length > 0 && (
                    <div>
                        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-1.5">
                            Project Channels
                        </p>
                        {projectConversations.map(renderSidebarItem)}
                    </div>
                )}
            </div>

            {/* Smart Non-Overflow Fixed Action Dropdown */}
            {menuState && (
                <div
                    className="fixed z-[99999] w-48 p-1.5 bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: menuState.placeAbove ? "auto" : `${menuState.top + 4}px`,
                        bottom: menuState.placeAbove ? `${window.innerHeight - menuState.top + 4}px` : "auto",
                        left: `${menuState.left}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(() => {
                        const targetConv = conversations.find((c) => c.id === menuState.convId);
                        if (!targetConv) return null;
                        return (
                            <button
                                onClick={(e) => {
                                    handleTogglePin(e, targetConv.id);
                                    setMenuState(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl transition-all text-left group"
                            >
                                <Pin className={`h-3.5 w-3.5 ${targetConv.is_pinned ? "fill-blue-500 text-blue-500" : "text-zinc-400 group-hover:text-blue-500"}`} />
                                <span>{targetConv.is_pinned ? "Unpin Conversation" : "Pin Conversation"}</span>
                            </button>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
