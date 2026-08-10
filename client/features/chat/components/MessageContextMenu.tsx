"use client";

import { Reply, Smile, Trash2, Edit2, Star } from "lucide-react";

interface MessageContextMenuProps {
    message: any;
    isOwnMessage: boolean;
    quickEmojis: string[];
    onReply?: (msg: any) => void;
    onToggleReaction?: (messageId: number, emoji: string) => void;
    onToggleStar?: (messageId: number) => void;
    onEdit?: (msg: any) => void;
    onDeleteForMe?: (messageId: number) => void;
    onDeleteForAll?: (messageId: number) => void;
}

export function MessageContextMenu({
    message,
    isOwnMessage,
    quickEmojis,
    onReply,
    onToggleReaction,
    onToggleStar,
    onEdit,
    onDeleteForMe,
    onDeleteForAll,
}: MessageContextMenuProps) {
    return (
        <div className="absolute right-0 bottom-full mb-1 z-20 hidden group-hover:flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
            {/* Quick Emoji Reactions */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-700 pr-1 mr-0.5">
                {quickEmojis.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => onToggleReaction && onToggleReaction(message.id, emoji)}
                        className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm flex items-center justify-center transition-transform hover:scale-125"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Star Message */}
            {onToggleStar && (
                <button
                    onClick={() => onToggleStar(message.id)}
                    className={`h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors ${message.is_starred ? "text-amber-500" : "text-zinc-500"}`}
                    title={message.is_starred ? "Unstar Message" : "Star Message"}
                >
                    <Star className={`h-3.5 w-3.5 ${message.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
                </button>
            )}

            {/* Reply */}
            {onReply && (
                <button
                    onClick={() => onReply(message)}
                    className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition-colors"
                    title="Reply"
                >
                    <Reply className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Edit (Own Messages) */}
            {isOwnMessage && onEdit && (
                <button
                    onClick={() => onEdit(message)}
                    className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center transition-colors"
                    title="Edit Message"
                >
                    <Edit2 className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Delete For Me */}
            {onDeleteForMe && (
                <button
                    onClick={() => onDeleteForMe(message.id)}
                    className="h-7 w-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Delete for me"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Delete For Everyone (Own Messages) */}
            {isOwnMessage && onDeleteForAll && (
                <button
                    onClick={() => onDeleteForAll(message.id)}
                    className="h-7 w-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                    title="Delete for everyone"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
