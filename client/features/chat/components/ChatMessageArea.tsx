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
        <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-hidden select-none">
            {/* ─── WhatsApp Web Header ───────────────────────────────────── */}
            <div className="h-16 flex items-center justify-between px-4 bg-[#202c33] shrink-0 border-b border-[#2a3942]/60 z-10">
                <div className="flex items-center gap-3.5 cursor-pointer">
                    {/* Avatar/Icon */}
                    {conversation.type === "project" ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm">
                            <Hash className="h-5 w-5 text-white" />
                        </div>
                    ) : conversation.type === "group" ? (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm">
                                <span className="text-xs font-bold text-white">{getInitials(getHeaderName())}</span>
                            </div>

                            {isOnline ? (
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
                            ) : null}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#e9edef] truncate tracking-tight">
                            {getHeaderName()}
                        </h3>
                        <p className="text-[11px] font-normal text-[#8696a0] truncate">
                            {isPartnerTyping ? (
                                <span className="text-[#00a884] font-medium animate-pulse">
                                    typing...
                                </span>
                            ) : conversation?.type === "direct" ? (
                                isOnline ? (
                                    <span className="text-[#00a884] font-normal">online</span>
                                ) : (
                                    <span>offline</span>
                                )
                            ) : (
                                <span>{getTypeLabel()}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1 text-[#8696a0]">
                    <button className="h-10 w-10 rounded-full hover:bg-[#2a3942]/60 flex items-center justify-center transition-colors">
                        <Phone className="h-4.5 w-4.5" />
                    </button>
                    <button className="h-10 w-10 rounded-full hover:bg-[#2a3942]/60 flex items-center justify-center transition-colors">
                        <Video className="h-4.5 w-4.5" />
                    </button>
                    <button className="h-10 w-10 rounded-full hover:bg-[#2a3942]/60 flex items-center justify-center transition-colors">
                        <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            {/* ─── Messages Scroll Area (WhatsApp Doodle Wallpaper) ──────── */}
            <div className="flex-1 overflow-y-auto wa-doodle-bg relative">
                <div className="max-w-4xl mx-auto px-6 py-4 space-y-1.5" ref={messagesEndRef}>
                    {/* Date pill badge */}
                    <div className="flex justify-center my-3">
                        <span className="bg-[#111b21] text-[#8696a0] text-[11px] font-medium px-3 py-1.5 rounded-md shadow-xs border border-[#2a3942]/30">
                            Today
                        </span>
                    </div>

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
                                className={`flex items-end gap-2 transition-all duration-300 ${isMe ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-2" : "mb-0.5"
                                    }`}
                            >
                                {/* Message Bubble */}
                                <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] group relative ${isMe ? "order-1" : ""}`}>
                                    {/* Sender name for groups */}
                                    {showAvatar && !isMe && (
                                        <p className="text-[11px] font-bold text-[#00a884] mb-1 ml-1">
                                            {msg.sender?.name}
                                        </p>
                                    )}

                                    <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* Bubble Body */}
                                        <div
                                            className={`px-3 py-1.5 text-xs md:text-sm leading-relaxed relative transition-all shadow-xs ${isMe
                                                ? "bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none"
                                                : "bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none"
                                                }`}
                                        >
                                            {/* Quoted Parent Message (WhatsApp Card style) */}
                                            {msg.parent && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (msg.parent?.id) scrollToMessage(msg.parent.id);
                                                    }}
                                                    title="Click to jump to message"
                                                    className={`mb-1.5 p-2 rounded-md border-l-[4px] text-xs cursor-pointer transition-all ${isMe
                                                        ? "bg-[#111b21]/60 border-[#53bdeb] text-[#e9edef] hover:bg-[#111b21]/80"
                                                        : "bg-[#111b21]/60 border-[#00a884] text-[#e9edef] hover:bg-[#111b21]/80"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 font-bold text-[11px]">
                                                        <span className={isMe ? "text-[#53bdeb]" : "text-[#00a884]"}>
                                                            {msg.parent.sender?.name || "User"}
                                                        </span>
                                                    </div>
                                                    <p className="line-clamp-2 mt-0.5 text-[#8696a0] font-normal text-[11px]">
                                                        {msg.parent.body}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Message Body & Inline Timestamp */}
                                            <div className="pr-14 pb-0.5 break-words font-normal tracking-wide leading-relaxed">
                                                {msg.body}
                                            </div>

                                            {/* Timestamp & Double Blue Checkmark */}
                                            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-[#8696a0] select-none">
                                                <span>{formatTime(msg.created_at)}</span>
                                                {isMe && (
                                                    <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Floating Hover Reply Action Button */}
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            title="Reply"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-[#202c33] border border-[#2a3942] shadow-sm flex items-center justify-center text-[#8696a0] hover:text-[#53bdeb] hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
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

            {/* ─── WhatsApp Web Composer Bar (Bottom Input Area) ─────────── */}
            <div className="px-4 py-2.5 bg-[#202c33] border-t border-[#2a3942]/60 shrink-0">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Replying-To Banner */}
                    {replyingTo && (
                        <div className="mb-2 p-2.5 bg-[#111b21] border-l-[4px] border-[#00a884] rounded-r-lg shadow-sm flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-1.5 text-[#00a884] font-bold text-xs">
                                    <Reply className="h-3.5 w-3.5" />
                                    <span>Replying to {replyingTo.sender?.name || "User"}</span>
                                </div>
                                <p className="text-[#8696a0] truncate mt-0.5 text-xs font-normal">{replyingTo.body}</p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="h-6 w-6 rounded-full hover:bg-[#2a3942] flex items-center justify-center text-[#8696a0] hover:text-white transition-all shrink-0 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Typing Banner */}
                    {typingUsers && typingUsers.length > 0 && (
                        <div className="px-2 py-0.5 mb-1.5 text-xs text-[#00a884] font-medium flex items-center gap-2">
                            <span>
                                {typingUsers.map((u) => u.name).join(", ")}{" "}
                                {typingUsers.length === 1 ? "is typing..." : "are typing..."}
                            </span>
                        </div>
                    )}

                    {/* WhatsApp Dark Input Bar */}
                    <div className="flex items-center gap-2">
                        {/* Plus Action */}
                        <button className="h-10 w-10 rounded-full hover:bg-[#2a3942]/70 flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0 cursor-pointer">
                            <Plus className="h-5 w-5" />
                        </button>

                        {/* Emoji Action */}
                        <button className="h-10 w-10 rounded-full hover:bg-[#2a3942]/70 flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0 cursor-pointer">
                            <Smile className="h-5 w-5" />
                        </button>

                        {/* Text Area */}
                        <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 flex items-center shadow-xs">
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
                                placeholder="Type a message"
                                rows={1}
                                className="w-full resize-none bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none py-0.5 max-h-32 overflow-y-auto leading-relaxed font-normal"
                                disabled={isSending}
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${inputText.trim() && !isSending
                                ? "bg-[#00a884] hover:bg-[#008f70] text-white shadow-sm hover:scale-105 active:scale-95"
                                : "text-[#8696a0] hover:bg-[#2a3942]/70"
                                }`}
                            onClick={handleSend}
                            disabled={!inputText.trim() || isSending}
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin text-[#8696a0]" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
