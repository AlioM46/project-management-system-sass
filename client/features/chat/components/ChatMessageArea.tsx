"use client";

import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Hash, Users, Loader2, Reply, X, CheckCheck, Plus } from "lucide-react";
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
    const { currentUser } = useCurrentUser();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const partner = conversation?.participants?.find((participant: any) => participant?.user?.id != currentUser?.id);
    const partnerId = partner?.user?.id;
    const isOnline = Boolean(partnerId && isUserOnline(partnerId));
    const isPartnerTyping = Boolean(
        partnerId && typingUsers?.some((user) => Number(user.id) === Number(partnerId))
    );

    // useEffect(() => {

    //     if (partnerId) {
    //         setIsOnline(isUserOnline(partnerId));
    //     }
    // }, [conversation]);

    useEffect(() => {

        messages.forEach((m, idx) => {
            console.log("MESSAGE #", idx, " - ", m)
        })

    }, [messages])



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

        await handleSendMessage(inputText.trim(), conversation.id, replyingTo?.id);

        setReplyingTo(null);
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

    const scrollToMessage = (messageId: number) => {
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
            setTimeout(() => {
                el.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
            }, 1500);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-100/60 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none">
            {/* ─── Chat Header (Website Native Theme) ───────────────────── */}
            <div className="h-16 flex items-center justify-between px-5 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 z-10">
                <div className="flex items-center gap-3.5 cursor-pointer">
                    {/* Avatar/Icon */}
                    {conversation.type === "project" ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <Hash className="h-5 w-5 text-white" />
                        </div>
                    ) : conversation.type === "group" ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <span className="text-xs font-bold text-white">{getInitials(getHeaderName())}</span>
                            </div>

                            {isOnline ? (
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
                            ) : null}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate tracking-tight">
                            {getHeaderName()}
                        </h3>
                        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                            {isPartnerTyping ? (
                                <span className="text-blue-500 font-semibold animate-pulse">
                                    typing...
                                </span>
                            ) : conversation?.type === "direct" ? (
                                isOnline ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                                ) : (
                                    <span>Offline</span>
                                )
                            ) : (
                                <span>{getTypeLabel()}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <button className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-center transition-colors">
                        <Phone className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-center transition-colors">
                        <Video className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-center transition-colors">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ─── Messages Scroll Area (With Chat Pattern Background) ───── */}
            <div className="flex-1 overflow-y-auto chat-pattern-bg relative">
                <div className="max-w-4xl mx-auto px-6 py-6 space-y-1.5" ref={messagesEndRef}>
                    {messages.map((msg: Message | any, index) => {
                        const isMe = msg.sender?.id === currentUserId;

                        const showAvatar =
                            !isMe && (index === 0 || messages[index - 1]?.user_id !== msg.user_id);

                        const isLastInGroup =
                            index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;

                        return (
                            <div
                                id={`message-${msg.id}`}
                                key={msg.id}
                                className={`flex items-end gap-2.5 transition-all duration-300 ${isMe ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"
                                    }`}
                            >
                                {/* Other user's avatar */}
                                {!isMe && (
                                    <div className="w-8 shrink-0 pb-0.5">
                                        {showAvatar ? (
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-bold text-white">
                                                    {getInitials(msg.sender?.name || "U")}
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Message Bubble Container */}
                                <div className={`max-w-[82%] md:max-w-[75%] lg:max-w-[65%] group relative ${isMe ? "order-1" : ""}`}>
                                    {/* Sender name for groups */}
                                    {showAvatar && !isMe && (
                                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 ml-1">
                                            {msg.sender?.name}
                                        </p>
                                    )}

                                    <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* Bubble */}
                                        <div
                                            className={`px-4 py-2.5 text-sm leading-relaxed transition-all shadow-xs ${isMe
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-blue-500/10"
                                                : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl rounded-tl-xs shadow-zinc-200/50 dark:shadow-none"
                                                }`}
                                        >
                                            {/* Quoted Parent Message */}
                                            {msg.parent && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (msg.parent?.id) scrollToMessage(msg.parent.id);
                                                    }}
                                                    title="Click to jump to message"
                                                    className={`mb-2 p-2.5 rounded-xl border-l-[4px] text-xs cursor-pointer transition-all shadow-xs ${isMe
                                                        ? "bg-black/20 border-white text-white hover:bg-black/30"
                                                        : "bg-blue-50/80 dark:bg-zinc-800/80 border-blue-500 dark:border-blue-400 text-zinc-800 dark:text-zinc-200 hover:bg-blue-100/70 dark:hover:bg-zinc-800"
                                                        }`}
                                                >
                                                    <div className={`flex items-center justify-between gap-2 font-bold text-[11px] ${isMe ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
                                                        <span>{msg.parent.sender?.name || "User"}</span>
                                                        <Reply className="h-3 w-3 opacity-80" />
                                                    </div>
                                                    <p className={`line-clamp-2 mt-0.5 font-normal ${isMe ? "text-blue-100" : "text-zinc-600 dark:text-zinc-300"}`}>
                                                        {msg.parent.body}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Message Body */}
                                            <div className="text-sm font-normal tracking-wide whitespace-pre-wrap">{msg.body}</div>

                                            {/* Timestamp & Double Checkmarks */}
                                            <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? "text-blue-100/80" : "text-zinc-400 dark:text-zinc-500"}`}>
                                                <span>{formatTime(msg.created_at)}</span>
                                                {isMe && (
                                                    <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Floating Hover Reply Action Button */}
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            title="Reply"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                                        >
                                            <Reply className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Message Input Composer (Website Native Theme) ─────────── */}
            <div className="p-4 shrink-0 bg-white/90 dark:bg-[#0a0a0a]/90 border-t border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Replying-To Banner */}
                    {replyingTo && (
                        <div className="mb-3 p-3 bg-blue-50/90 dark:bg-zinc-800/90 border-l-[5px] border-blue-600 dark:border-blue-500 rounded-r-2xl shadow-sm flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                    <Reply className="h-3.5 w-3.5" />
                                    <span>Replying to {replyingTo.sender?.name || "User"}</span>
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-300 truncate mt-1 text-xs font-normal">{replyingTo.body}</p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="h-7 w-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all shrink-0 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Typing Banner */}
                    {typingUsers && typingUsers.length > 0 && (
                        <div className="px-3 py-1 mb-2 text-xs text-zinc-500 dark:text-zinc-400 italic flex items-center gap-2">
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

                    <div className="flex items-end gap-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/90 dark:border-zinc-700/80 rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-md transition-all">
                        {/* Plus Action */}
                        <button className="h-8.5 w-8.5 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0 mb-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                            <Plus className="h-4.5 w-4.5" />
                        </button>

                        {/* Attachment */}
                        <button className="h-8.5 w-8.5 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0 mb-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                            <Paperclip className="h-4 w-4" />
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
                            className="flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none py-1.5 max-h-32 overflow-y-auto font-normal leading-relaxed"
                            disabled={isSending}
                        />

                        {/* Emoji */}
                        <button className="h-8.5 w-8.5 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0 mb-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                            <Smile className="h-4 w-4" />
                        </button>

                        {/* Send */}
                        <button
                            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5 ${inputText.trim() && !isSending
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                                : isSending
                                    ? "bg-blue-600/70 cursor-not-allowed"
                                    : "bg-zinc-200/70 dark:bg-zinc-700/50 cursor-not-allowed"
                                }`}
                            onClick={handleSend}
                            disabled={!inputText.trim() || isSending}
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                                <Send className={`h-4 w-4 ${inputText.trim() ? "text-white" : "text-zinc-400 dark:text-zinc-500"}`} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
