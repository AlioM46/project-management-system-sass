"use client";

import { MoreVertical, Phone, Video, Hash, Users, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Conversation, Message } from "../types";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { MessageItem } from "./MessageItem";
import { MessageInputComposer } from "./MessageInputComposer";

interface ChatMessageAreaProps {
    conversation: any | null;
    messages: any[];
    currentUserId: number;
    inputText: string;
    isSending: boolean;
    onInputTextChange: (text: string) => void;
    handleSendMessage: (body: string, conversationId: number, messageId?: number, attachments?: File[]) => Promise<void>;
    isUserOnline: (userId: number | undefined | null) => boolean;
    typingUsers?: { id: number; name: string }[];
    onTyping?: (isTyping: boolean) => void;
    onToggleReaction?: (messageId: number, emoji: string) => void;
    onDeleteForMe?: (messageId: number) => Promise<void>;
    onDeleteForAll?: (messageId: number) => Promise<void>;
    onEditMessage?: (messageId: number, body: string) => Promise<void>;
    hasMore?: boolean;
    onLoadMore?: () => Promise<void>;
}

export function ChatMessageArea({
    conversation,
    messages,
    currentUserId,
    inputText,
    onInputTextChange,
    handleSendMessage,
    isSending,
    isUserOnline,
    typingUsers = [],
    onTyping,
    onToggleReaction,
    onDeleteForMe,
    onDeleteForAll,
    onEditMessage,
    hasMore = false,
    onLoadMore,
}: ChatMessageAreaProps) {
    const { currentUser } = useCurrentUser();
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isPrevLoading, setIsPrevLoading] = useState(false);
    const [showNewMessagesBtn, setShowNewMessagesBtn] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);

    const prevScrollHeightRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);
    const prevMessagesLengthRef = useRef<number>(messages?.length || 0);

    useEffect(() => {
        const handleOutsideClick = () => {
            setActiveMenuMessageId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const partner = conversation?.participants?.find((participant: any) => participant?.user?.id != currentUser?.id);
    const partnerId = partner?.user?.id;
    const isOnline = Boolean(partnerId && isUserOnline(partnerId));
    const isPartnerTyping = Boolean(
        partnerId && typingUsers?.some((user) => Number(user.id) === Number(partnerId))
    );

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (!container) return;

        // 1. Detect if user is near top and has more
        if (container.scrollTop <= 10 && hasMore && onLoadMore && !isFetchingRef.current) {
            isFetchingRef.current = true;
            setIsPrevLoading(true);

            prevScrollHeightRef.current = container.scrollHeight;

            try {
                await onLoadMore();
            } finally {
                isFetchingRef.current = false;
                setIsPrevLoading(false);
            }
        }

        // 2. Hide "new messages" button if user scrolls to bottom
        const distanceToBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
        if (distanceToBottom < 100) {
            setShowNewMessagesBtn(false);
            setNewMessagesCount(0);
        }
    };

    // Auto-scroll logic on messages changes
    useEffect(() => {
        if (!messages) return;

        const container = messagesEndRef.current;
        if (!container) return;

        // means there is previous messages loaded
        if (prevScrollHeightRef.current > 0) {
            // Restore reading position after prepending older messages
            const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
            container.scrollTop = heightDiff;
            prevScrollHeightRef.current = 0; // Reset
        } else {
            // Check if messages count increased by a new message
            const hasNewIncomingMessage = messages.length > prevMessagesLengthRef.current;
            if (hasNewIncomingMessage) {
                const lastMessage = messages[messages.length - 1];
                const isSentByMe = lastMessage?.user_id === currentUserId;

                const distanceToBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
                const isNearBottom = distanceToBottom < 150;

                if (isNearBottom || isSentByMe) {
                    requestAnimationFrame(() => {
                        container.scrollTop = container.scrollHeight;
                    });
                } else {
                    setShowNewMessagesBtn(true);
                    setNewMessagesCount((prev) => prev + 1);
                }
            } else {
                if (prevMessagesLengthRef.current === 0) {
                    requestAnimationFrame(() => {
                        container.scrollTop = container.scrollHeight;
                    });
                }
            }
        }

        prevMessagesLengthRef.current = messages.length;
    }, [messages, currentUserId]);

    // Auto-focus textarea when sending finishes or conversation changes
    useEffect(() => {
        if (!isSending && conversation) {
            textAreaRef.current?.focus();
        }
    }, [isSending, conversation]);

    const scrollToMessage = (messageId: number) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("bg-amber-100/50", "dark:bg-amber-900/30", "transition-all");
            setTimeout(() => {
                element.classList.remove("bg-amber-100/50", "dark:bg-amber-900/30");
            }, 2000);
        }
    };

    const scrollToBottomSmoothly = () => {
        messagesEndRef.current?.scrollTo({
            top: messagesEndRef.current.scrollHeight,
            behavior: "smooth",
        });
        setShowNewMessagesBtn(false);
        setNewMessagesCount(0);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/40 p-8">
                <div className="h-16 w-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center mb-4 text-blue-500">
                    <Hash className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">No active conversation</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px] text-center">
                    Select a conversation from the sidebar or start a new one to begin messaging.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/10 overflow-hidden relative">
            {/* Header */}
            <div className="h-[65px] border-b border-zinc-200 dark:border-white/10 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {conversation.type === "project" ? (
                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
                            <Users className="h-5 w-5" />
                        </div>
                    ) : (
                        <div className="relative shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <span className="text-xs font-bold text-white">
                                    {getInitials(partner?.user?.name || "U")}
                                </span>
                            </div>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                            )}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {conversation.type === "project"
                                ? conversation.project?.name || "Project Chat"
                                : partner?.user?.name || "Direct Message"}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                            {isPartnerTyping ? (
                                <span className="text-blue-500 dark:text-blue-400 animate-pulse font-semibold">typing...</span>
                            ) : conversation.type === "project" ? (
                                `${conversation.participants?.length || 0} participants`
                            ) : isOnline ? (
                                <span className="text-emerald-500 font-semibold">online</span>
                            ) : (
                                "offline"
                            )}
                        </p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1">
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                        <Phone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                        <Video className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors">
                        <MoreVertical className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>
            </div>

            {/* ─── Messages List ───────────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {isPrevLoading && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-2 text-xs text-zinc-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        <span>Loading older messages...</span>
                    </div>
                )}

                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-1"
                    ref={messagesEndRef}
                    onScroll={handleScroll}
                >
                    {messages.map((msg: Message | any, index) => (
                        <MessageItem
                            key={msg.id}
                            msg={msg}
                            index={index}
                            messages={messages}
                            currentUserId={currentUserId}
                            conversation={conversation}
                            activeMenuMessageId={activeMenuMessageId}
                            setActiveMenuMessageId={setActiveMenuMessageId}
                            editingMessage={editingMessage}
                            setEditingMessage={setEditingMessage}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            onInputTextChange={onInputTextChange}
                            onToggleReaction={onToggleReaction}
                            onDeleteForMe={onDeleteForMe}
                            onDeleteForAll={onDeleteForAll}
                            scrollToMessage={scrollToMessage}
                            getInitials={getInitials}
                            formatTime={formatTime}
                        />
                    ))}
                </div>

                {showNewMessagesBtn && (
                    <button
                        onClick={scrollToBottomSmoothly}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 animate-bounce"
                    >
                        <span>New Messages</span>
                        {newMessagesCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-bold">
                                {newMessagesCount}
                            </span>
                        )}
                        <span>↓</span>
                    </button>
                )}
            </div>

            {/* ─── Message Input Composer ───────────────────────────────── */}
            <MessageInputComposer
                conversationId={conversation.id}
                isSending={isSending}
                inputText={inputText}
                onInputTextChange={onInputTextChange}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                editingMessage={editingMessage}
                setEditingMessage={setEditingMessage}
                typingUsers={typingUsers}
                onTyping={onTyping}
                onEditMessage={onEditMessage}
                handleSendMessage={handleSendMessage}
                textAreaRef={textAreaRef}
            />
        </div>
    );
}
