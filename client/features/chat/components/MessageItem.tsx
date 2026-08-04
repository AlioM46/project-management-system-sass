import { Reply, Paperclip, MoreVertical, Smile } from "lucide-react";
import { Message, Participant } from "../types";
import { AttachmentPreview } from "@/components/modals/task-details/attachment-preview";

interface MessageItemProps {
    msg: Message | any;
    index: number;
    messages: any[];
    currentUserId: number;
    conversation: any;
    activeMenuMessageId: number | null;
    setActiveMenuMessageId: (id: number | null) => void;
    editingMessage: Message | null;
    setEditingMessage: (msg: Message | null) => void;
    replyingTo: Message | null;
    setReplyingTo: (msg: Message | null) => void;
    onInputTextChange: (text: string) => void;
    onToggleReaction?: (messageId: number, emoji: string) => void;
    onDeleteForMe?: (messageId: number) => Promise<void>;
    onDeleteForAll?: (messageId: number) => Promise<void>;
    scrollToMessage: (messageId: number) => void;
    getInitials: (name: string) => string;
    formatTime: (dateStr: string) => string;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉"];

export function MessageItem({
    msg,
    index,
    messages,
    currentUserId,
    conversation,
    activeMenuMessageId,
    setActiveMenuMessageId,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    onInputTextChange,
    onToggleReaction,
    onDeleteForMe,
    onDeleteForAll,
    scrollToMessage,
    getInitials,
    formatTime,
}: MessageItemProps) {
    const isMe = msg.sender?.id === currentUserId;

    const showAvatar =
        !isMe && (index === 0 || messages[index - 1]?.user_id !== msg.user_id);

    const isLastInGroup =
        index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;

    const isMessageEditable = (msg: Message) => {
        if (msg.user_id !== currentUserId) return false;
        const timeDiff = Date.now() - new Date(msg.created_at).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return timeDiff < fifteenMinutes;
    };

    const isMessageDeletableForAll = (msg: Message) => {
        const currentUserParticipant = conversation?.participants?.find(
            (p: Participant) => p.user_id === currentUserId
        );
        const isMsgAdmin = currentUserParticipant?.role === 'admin' || currentUserParticipant?.role === 'owner';
        if (isMsgAdmin) return true;

        if (msg.user_id !== currentUserId) return false;

        const timeDiff = Date.now() - new Date(msg.created_at).getTime();
        const fifteenMinutes = 15 * 60 * 1000;
        return timeDiff < fifteenMinutes;
    };

    return (
        <div
            id={`message-${msg.id}`}
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

            <div
                className={`max-w-[70%] group ${isMe ? "order-1" : ""}`}
                onMouseLeave={() => {
                    if (activeMenuMessageId === msg.id) {
                        setActiveMenuMessageId(null);
                    }
                }}
            >
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
                                            <span>{emoji}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Reply Action button */}
                            <button
                                onClick={() => setReplyingTo(msg)}
                                className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shadow-sm transition-all"
                                title="Reply to message"
                            >
                                <Reply className="h-3 w-3" />
                            </button>

                            {/* Dropdown Menu Toggle */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                                    }}
                                    className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shadow-sm transition-all"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </button>

                                {/* Dropdown Menu content */}
                                {activeMenuMessageId === msg.id && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute z-50 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-2 ${isMe ? "right-0" : "left-0"}`}
                                    >
                                        {isMessageEditable(msg) && (
                                            <button
                                                onClick={() => {
                                                    setEditingMessage(msg);
                                                    onInputTextChange(msg.body || "");
                                                    setActiveMenuMessageId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {isMessageDeletableForAll(msg) && (
                                            <button
                                                onClick={() => {
                                                    if (onDeleteForAll) onDeleteForAll(msg.id);
                                                    setActiveMenuMessageId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                            >
                                                Delete for Everyone
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
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
}
