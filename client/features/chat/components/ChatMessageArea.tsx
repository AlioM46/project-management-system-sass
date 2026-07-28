"use client";

import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Hash, Users, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Message } from "../types";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

interface ChatMessageAreaProps {
    conversation: any | null;
    messages: any[];
    currentUserId: number;
    inputText: string;
    isSending: boolean;
    onInputTextChange: (text: string) => void;
    handleSendMessage: (body: string, conversationId: number, messageId?: number) => Promise<void>;
    isUserOnline: (userId: number | undefined | null) => boolean;
    typingUsers?: { id: number; name: string }[];
    onTyping?: (isTyping: boolean) => void;
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
}: ChatMessageAreaProps) {
    const [replyId, setReplyId] = useState<number | null>(null);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const { currentUser } = useCurrentUser();
    const [isOnline, setIsOnline] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const partner = conversation?.participants?.find((participant: any) => participant?.user?.id != currentUser?.id);
        const partnerId = partner?.user?.id;

        if (partnerId) {
            setIsOnline(isUserOnline(partnerId));
        }
    }, [conversation]);

    const handleTextChange = (text: string) => {
        onInputTextChange(text);

        if (onTyping) {
            onTyping(true);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 1500);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || isSending || !conversation) return;

        if (onTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            onTyping(false);
        }

        await handleSendMessage(inputText.trim(), conversation.id);
    };


    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        if (!messages) return;

        // Without requestAnimationFrame: The browser runs your scroll code before it calculates the height of the new message. So it scrolls to the bottom of the old messages.
        //  With requestAnimationFrame: The browser waits until it has fully rendered the new message and recalculated the height, and then it scrolls. You are guaranteed to scroll to the true, new bottom.


        // rAF means:
        // Hey Browser, I will wait until you fully render your UI
        // then I will catch your REAL "scrollHeight"

        // The trick: use requestAnimationFrame to wait for the NEXT frame.
        // This ensures React has finished rendering the new message and updated the scrollHeight before we scroll.

        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollTo({
                top: messagesEndRef.current.scrollHeight,
                behavior: "smooth",
            });
        });


    }, [messages])

    // Auto-focus textarea when sending finishes or conversation changes
    useEffect(() => {
        if (!isSending && conversation) {
            textAreaRef.current?.focus();
        }
    }, [isSending, conversation?.id]);


    // Helper: Get initials from a name
    function getInitials(name: string): string {
        return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    }

    // Helper: Get display name for the conversation header
    function getHeaderName(): string {
        if (!conversation) return "";
        if (conversation.type === "project" && conversation.project) return conversation.project.name;
        if (conversation.name) return conversation.name;
        if (conversation.participants?.[0]?.user?.name && currentUser && currentUser.id !== conversation.participants[0].user.id) return conversation.participants[0].user.name;
        if (conversation.participants?.[1]?.user?.name && currentUser && currentUser.id !== conversation.participants[1].user.id) return conversation.participants[1].user.name;
        return "Unknown";
    }

    // Helper: Get type label
    function getTypeLabel(): string {
        if (!conversation) return "";
        if (conversation.type === "project") return "Project Channel";
        if (conversation.type === "group") return `${conversation.participants?.length || 0} members`;
        return "Direct Message";
    }

    // Helper: Format time from ISO string
    function formatTime(isoString: string): string {
        // Need to handle the date, it only show hours
        // if date == today ? Show hours : show date+ hours
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // ─── Empty State ───────────────────────────────────────────────────
    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-50/50 dark:bg-[#050505]">
                <div className="text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                        <Send className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                        Select a conversation
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                        Choose a chat from the sidebar to start messaging your team members.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-[#050505]">
            {/* ─── Chat Header ─────────────────────────────────────────── */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-3">
                    {/* Avatar/Icon */}
                    {conversation.type === "project" ? (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <Hash className="h-4 w-4 text-white" />
                        </div>
                    ) : conversation.type === "group" ? (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <span className="text-xs font-bold text-white">{getInitials(getHeaderName())}</span>
                            </div>

                            {isOnline ? (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
                            ) : (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gray-500 border-2 border-white dark:border-[#0a0a0a]" />
                            )}

                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {getHeaderName()}
                        </h3>
                        <p className="text-[11px] font-medium">
                            {typingUsers && typingUsers.length > 0 ? (
                                <span className="text-blue-500 font-semibold animate-pulse">
                                    typing...
                                </span>
                            ) : conversation?.type === "direct" ? (
                                isOnline ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                                ) : (
                                    <span className="text-zinc-400">Offline</span>
                                )
                            ) : (
                                <span className="text-zinc-500 dark:text-zinc-400">{getTypeLabel()}</span>
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1" ref={messagesEndRef}>
                {messages.map((msg: Message | any, index) => {
                    const isMe = msg.sender.id === currentUserId;
                    // !isMe — It's not my message (I don't need to see my own avatar).
                    // AND either:
                    // index === 0 — It's the very first message in the list.
                    // messages[index - 1]?.user_id !== msg.user_id — The previous message was from a different person.

                    const showAvatar =
                        !isMe && (index === 0 || messages[index - 1]?.user_id !== msg.user_id);

                    // It is true when:
                    // index === messages.length - 1 — It's the very last message overall.
                    // OR messages[index + 1]?.user_id !== msg.user_id — The next message is from a different person.

                    const isLastInGroup =
                        index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"
                                }`}
                        >
                            {/* Other user's avatar */}
                            {!isMe && (
                                <div className="w-8 shrink-0">
                                    {showAvatar ? (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white">
                                                {getInitials(msg.sender.name)}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`max-w-[65%] group ${isMe ? "order-1" : ""}`}>
                                {/* Sender name (only for first message in a group, and only for others) */}
                                {showAvatar && !isMe && (
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">
                                        {msg.sender.name}
                                    </p>
                                )}

                                <div className="flex items-end gap-2">
                                    <div
                                        className={`px-3.5 py-2 text-sm leading-relaxed ${isMe
                                            ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                                            : "bg-white dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10 rounded-2xl rounded-bl-md"
                                            }`}
                                    >
                                        {msg.body}
                                    </div>

                                    {/* Timestamp (visible on hover) */}
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pb-0.5">
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Message Input ────────────────────────────────────────── */}
            <div className="px-5 pb-4 pt-2 shrink-0">
                {/* Typing Indicator Banner */}
                {typingUsers && typingUsers.length > 0 && (
                    <div className="px-3 py-1 mb-1.5 text-xs text-zinc-500 dark:text-zinc-400 italic flex items-center gap-2">
                        <span>
                            {typingUsers.map((u) => u.name).join(", ")}{" "}
                            {typingUsers.length === 1 ? "is typing..." : "are typing..."}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500/50 focus-within:shadow-md transition-all">
                    {/* Attachment */}
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 mb-0.5">
                        <Paperclip className="h-4 w-4 text-zinc-400" />
                    </button>

                    {/* Text Input */}
                    <textarea
                        ref={textAreaRef}
                        value={inputText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none py-1.5 max-h-32 overflow-y-auto"
                        disabled={isSending}
                    />

                    {/* Emoji */}
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 mb-0.5">
                        <Smile className="h-4 w-4 text-zinc-400" />
                    </button>

                    {/* Send */}
                    <button
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${inputText.trim() && !isSending
                            ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                            : isSending
                                ? "bg-blue-600/70 cursor-not-allowed"
                                : "bg-zinc-100 dark:bg-white/10 cursor-not-allowed"
                            }`}
                        onClick={handleSend}
                        disabled={!inputText.trim() || isSending}
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <Send className={`h-4 w-4 ${inputText.trim() ? "text-white" : "text-zinc-400"}`} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
