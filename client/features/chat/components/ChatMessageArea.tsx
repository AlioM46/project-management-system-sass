"use client";

import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Hash, Users, Loader2, Reply, X, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Message } from "../types";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { toast } from "sonner";
import { AttachmentPreview } from "@/components/modals/task-details/attachment-preview";

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
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉"];

function SelectedFilePreviewCard({ file, onRemove, getFileIcon }: { file: File; onRemove: () => void; getFileIcon: (type: string) => string }) {
    const [previewUrl, setPreviewUrl] = useState<string>("");

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const isImage = file.type?.startsWith('image/') || file.name?.toLowerCase().match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i);
    const isVideo = file.type?.startsWith('video/') || file.name?.toLowerCase().match(/\.(mp4|webm|mov|avi|m4v)$/i);
    const isPDF = file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf');

    return (
        <div className="relative group h-16 w-16 bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 shadow-sm flex items-center justify-center overflow-hidden">
            {isImage ? (
                previewUrl && <img className="h-full w-full object-cover" src={previewUrl} alt={file.name} />
            ) : isVideo ? (
                previewUrl && <video className="h-full w-full object-cover bg-black" src={previewUrl} />
            ) : isPDF ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/40 text-red-500 text-[10px] font-bold">
                    <FileText className="h-5 w-5 mb-0.5" />
                    <span>PDF</span>
                </div>
            ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500 text-[10px] font-bold">
                    <FileText className="h-5 w-5 mb-0.5" />
                    <span>{getFileIcon(file.type)}</span>
                </div>
            )}
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-sm"
                title="Remove attachment"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
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
}: ChatMessageAreaProps) {
    const { currentUser } = useCurrentUser();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editBodyText, setEditBodyText] = useState<string>("");

    useEffect(() => {
        const handleOutsideClick = () => {
            setActiveMenuMessageId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const isMessageEditable = (msg: Message) => {
        if (msg.user_id !== currentUserId) return false;
        const timeDiff = Date.now() - new Date(msg.created_at).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return timeDiff < fifteenMinutes;
    };

    const isMessageDeletableForAll = (msg: Message) => {
        // Owner or Admin of conversation can always delete for everyone
        const currentUserParticipant = conversation?.participants?.find(
            (p: any) => p.user_id === currentUserId
        );
        const isMsgAdmin = currentUserParticipant?.role === 'admin' || currentUserParticipant?.role === 'owner';
        if (isMsgAdmin) return true;

        if (msg.user_id !== currentUserId) return false;

        const timeDiff = Date.now() - new Date(msg.created_at).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return timeDiff < fifteenMinutes;
    };

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const incomingFiles = Array.from(e.target.files);
            const MAX_SIZE = 15 * 1024 * 1024; // 15MB

            const validSizeFiles = incomingFiles.filter(file => {
                if (file.size > MAX_SIZE) {
                    toast.error(`File "${file.name}" exceeds the 15MB size limit.`);
                    return false;
                }
                return true;
            });

            const uniqueFiles = validSizeFiles.filter((newFile) => {
                return !selectedFiles.some(
                    (existingFile) => existingFile.name === newFile.name
                        && existingFile.size === newFile.size
                        && existingFile.type === newFile.type
                        && existingFile.lastModified === newFile.lastModified
                );
            });

            setSelectedFiles((prev) => [...prev, ...uniqueFiles]);
        }
    };

    const handleSend = async () => {
        const hasText = Boolean(inputText.trim());
        const hasFiles = selectedFiles.length > 0;
        if ((!hasText && !hasFiles) || isSending || !conversation) return;

        if (onTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            onTyping(false);
        }

        await handleSendMessage(inputText.trim(), conversation.id, replyingTo?.id, selectedFiles);

        setReplyingTo(null);
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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

    // Helper: Get label/icon text for files
    function getFileIcon(type: string): string {
        if (type.includes("pdf")) return "PDF";
        if (type.includes("word") || type.includes("officedocument.word")) return "DOC";
        if (type.includes("excel") || type.includes("officedocument.sheet")) return "XLS";
        if (type.includes("zip") || type.includes("rar") || type.includes("compressed")) return "ZIP";
        if (type.startsWith("video/")) return "VID";
        if (type.startsWith("audio/")) return "AUD";
        return "FILE";
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
                            {isPartnerTyping ? (
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
                    const isMe = msg.sender?.id === currentUserId;

                    const showAvatar =
                        !isMe && (index === 0 || messages[index - 1]?.user_id !== msg.user_id);

                    const isLastInGroup =
                        index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;

                    return (
                        <div
                            id={`message-${msg.id}`}
                            key={msg.id}
                            className={`flex items-end gap-2 transition-all duration-300 ${isMe ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"
                                }`}
                        >
                            {/* Other user's avatar */}
                            {!isMe && (
                                <div className="w-8 shrink-0">
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
                            <div className={`max-w-[70%] group ${isMe ? "order-1" : ""}`}>
                                {/* Sender name */}
                                {showAvatar && !isMe && (
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">
                                        {msg.sender?.name}
                                    </p>
                                )}

                                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    {/* Bubble */}
                                    <div
                                        className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all relative ${msg.isDeleted
                                            ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
                                            : isMe
                                                ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                                                : "bg-white dark:bg-white/5 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10 rounded-2xl rounded-bl-md"
                                            }`}
                                    >
                                        {msg.isDeleted ? (
                                            <div className="text-sm italic text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 py-0.5">
                                                <span>🚫</span>
                                                <span>
                                                    {msg.deletedById === msg.user_id
                                                        ? isMe
                                                            ? "You deleted this message"
                                                            : `${msg.sender?.name || "User"} deleted this message`
                                                        : "This message was deleted by Admin"
                                                    }
                                                </span>
                                            </div>
                                        ) : editingMessageId === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[220px]">
                                                <textarea
                                                    value={editBodyText}
                                                    onChange={(e) => setEditBodyText(e.target.value)}
                                                    className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setEditingMessageId(null)}
                                                        className="px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (onEditMessage && editBodyText.trim()) {
                                                                await onEditMessage(msg.id, editBodyText);
                                                                setEditingMessageId(null);
                                                            }
                                                        }}
                                                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Quoted Parent Message (WhatsApp Style Card) */}
                                                {msg.parent && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (msg.parent?.id) scrollToMessage(msg.parent.id);
                                                        }}
                                                        title="Click to jump to original message"
                                                        className={`mb-2 p-2.5 rounded-xl border-l-[4px] text-xs cursor-pointer transition-all shadow-sm ${isMe
                                                            ? "bg-black/20 border-white text-white hover:bg-black/30"
                                                            : "bg-zinc-100 dark:bg-white/10 border-blue-500 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-white/15"
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
                                                {msg.body && <div className="text-sm font-normal">{msg.body}</div>}

                                                {/* Message Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2.5 space-y-2 border-t border-zinc-100 dark:border-white/5 pt-2">
                                                        {msg.attachments.map((attachment: any) => {
                                                            const showRawPreview =
                                                                attachment.file_type?.startsWith("image/") ||
                                                                attachment.file_type?.startsWith("video/") ||
                                                                attachment.file_type?.includes("pdf");

                                                            if (showRawPreview) {
                                                                return (
                                                                    <div key={attachment.id} className="rounded-xl overflow-hidden shadow-xs border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 p-1">
                                                                        <AttachmentPreview
                                                                            url={attachment.download_url}
                                                                            fileName={attachment.file_name}
                                                                            fileType={attachment.file_type}
                                                                        />
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <a
                                                                    key={attachment.id}
                                                                    href={attachment.download_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all shadow-sm ${isMe
                                                                        ? "bg-black/20 border-white/20 text-white hover:bg-black/30"
                                                                        : "bg-zinc-100 dark:bg-white/10 border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-white/15"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                                                            <Paperclip className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-semibold truncate max-w-[180px]">{attachment.file_name}</p>
                                                                            <p className="text-[10px] opacity-75 mt-0.5">{(attachment.file_size / 1024).toFixed(1)} KB</p>
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Floating Hover Actions (Reply + Quick Emoji Picker) & Timestamp */}
                                    {!msg.isDeleted && (
                                        <div className={`flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 relative ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            {/* Quick Emoji Picker Floating Overlay */}
                                            <div className="flex items-center gap-0.5 p-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-md">
                                                {QUICK_EMOJIS.map((emoji) => {
                                                    const hasReacted = msg.reactions?.some(
                                                        (r: any) => r.user_id === currentUserId && r.emoji === emoji
                                                    );
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => onToggleReaction && onToggleReaction(msg.id, emoji)}
                                                            title={`React with ${emoji}`}
                                                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs hover:scale-125 active:scale-95 transition-transform ${hasReacted ? "bg-blue-100 dark:bg-blue-900/50 ring-1 ring-blue-500" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                                }`}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Reply Button */}
                                            <button
                                                onClick={() => setReplyingTo(msg)}
                                                title="Reply to message"
                                                className="h-7 w-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <Reply className="h-3.5 w-3.5" />
                                            </button>

                                            {/* More Actions Dropdown Button */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                                                    }}
                                                    title="More actions"
                                                    className="h-7 w-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                </button>

                                                {activeMenuMessageId === msg.id && (
                                                    <div className={`absolute bottom-8 z-50 w-36 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg ${isMe ? "left-0" : "right-0"}`}>
                                                        {isMessageEditable(msg) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingMessageId(msg.id);
                                                                    setEditBodyText(msg.body);
                                                                    setActiveMenuMessageId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                                            >
                                                                Edit Message
                                                            </button>
                                                        )}
                                                        {isMessageDeletableForAll(msg) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onDeleteForAll) onDeleteForAll(msg.id);
                                                                    setActiveMenuMessageId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                            >
                                                                Delete for Everyone
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onDeleteForMe) onDeleteForMe(msg.id);
                                                                setActiveMenuMessageId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                                        >
                                                            Delete for Me
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 select-none">
                                                {msg.isEdited && (
                                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 italic mr-0.5">
                                                        edited
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Aggregated Reaction Badges under Bubble */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                        {Object.values(
                                            msg.reactions.reduce((acc: any, r: any) => {
                                                if (!acc[r.emoji]) {
                                                    acc[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false, users: [] };
                                                }
                                                acc[r.emoji].count += 1;
                                                acc[r.emoji].users.push(r.user?.name || "User");
                                                if (r.user_id === currentUserId) {
                                                    acc[r.emoji].hasReacted = true;
                                                }
                                                return acc;
                                            }, {})
                                        ).map((reaction: any) => (
                                            <button
                                                key={reaction.emoji}
                                                onClick={() => onToggleReaction && onToggleReaction(msg.id, reaction.emoji)}
                                                title={`Reacted by: ${reaction.users.join(", ")}`}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all cursor-pointer ${reaction.hasReacted
                                                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                                                    : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                    }`}
                                            >
                                                <span>{reaction.emoji}</span>
                                                <span className="text-[11px] font-bold">{reaction.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Message Input ────────────────────────────────────────── */}
            <div className="px-5 pb-4 pt-2 shrink-0">
                {/* WhatsApp Web Style Replying-To Quote Preview Banner */}
                {replyingTo && (
                    <div className="mb-2.5 p-3 bg-zinc-100/90 dark:bg-zinc-800/90 border-l-[5px] border-blue-500 rounded-r-2xl shadow-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                <Reply className="h-3.5 w-3.5" />
                                <span>Replying to {replyingTo.sender?.name || "User"}</span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-300 truncate mt-1 text-xs font-normal">{replyingTo.body}</p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="h-7 w-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
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

                {/* Selected Files Preview Banner */}
                {selectedFiles.length > 0 && (
                    <div className="mb-2.5 p-3.5 bg-zinc-100/90 dark:bg-zinc-800/90 border-l-[5px] border-blue-500 rounded-r-2xl shadow-md flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                            <span>Selected Attachments ({selectedFiles.length})</span>
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {selectedFiles.map((file, idx) => (
                                <SelectedFilePreviewCard
                                    key={idx}
                                    file={file}
                                    onRemove={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                    getFileIcon={getFileIcon}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500/50 focus-within:shadow-md transition-all">
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {/* Attachment */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 mb-0.5 ${selectedFiles.length > 0 ? "text-blue-500 bg-blue-500/10" : ""}`}
                    >
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
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${(inputText.trim() || selectedFiles.length > 0) && !isSending
                            ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                            : isSending
                                ? "bg-blue-600/70 cursor-not-allowed"
                                : "bg-zinc-100 dark:bg-white/10 cursor-not-allowed"
                            }`}
                        onClick={handleSend}
                        disabled={(!inputText.trim() && selectedFiles.length === 0) || isSending}
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <Send className={`h-4 w-4 ${(inputText.trim() || selectedFiles.length > 0) ? "text-white" : "text-zinc-400"}`} />
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
}
