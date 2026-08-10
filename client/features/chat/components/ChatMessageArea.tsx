"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Star, FileText } from "lucide-react";
import { getInitials, formatTime } from "../utils/chatHelpers";
import { VoicePlayerCard } from "./VoicePlayerCard";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageContextMenu } from "./MessageContextMenu";
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
    recordingUsers?: { id: number; name: string }[];
    onRecording?: (isRecording: boolean) => void;
    onToggleReaction?: (messageId: number, emoji: string) => void;
    onToggleStarMessage?: (messageId: number) => Promise<void>;
    onDeleteForMe?: (messageId: number) => Promise<void>;
    onDeleteForAll?: (messageId: number) => Promise<void>;
    onEditMessage?: (messageId: number, body: string) => Promise<void>;
    onUnblockUser?: (userId: number) => Promise<void>;
    hasBefore?: boolean;
    hasAfter?: boolean;
    onLoadMore?: () => Promise<void>;
    onLoadNewer?: () => Promise<void>;
    onToggleSearch?: () => void;
    isSearchOpen?: boolean;
    onToggleInfoSidebar?: () => void;
    isInfoSidebarOpen?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉"];

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
    recordingUsers = [],
    onRecording,
    onToggleReaction,
    onToggleStarMessage,
    onDeleteForMe,
    onDeleteForAll,
    onEditMessage,
    onUnblockUser,
    hasBefore = false,
    hasAfter = false,
    onLoadMore,
    onLoadNewer,
    onToggleSearch,
    isSearchOpen = false,
    onToggleInfoSidebar,
    isInfoSidebarOpen = false,
}: ChatMessageAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [editingMessage, setEditingMessage] = useState<{ id: number; body: string } | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

    // Auto-scroll to bottom on initial message load
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
                    <FileText className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">No Conversation Selected</h3>
                <p className="text-sm text-zinc-500 max-w-sm">Choose a conversation from the left sidebar to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Header */}
            <ChatHeader
                conversation={conversation}
                currentUserId={currentUserId}
                isUserOnline={isUserOnline}
                onToggleSearch={onToggleSearch}
                isSearchOpen={isSearchOpen}
                onToggleInfoSidebar={onToggleInfoSidebar}
                isInfoSidebarOpen={isInfoSidebarOpen}
            />

            {/* Scrollable Messages Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
            >
                {/* Pagination Load More Button */}
                {hasBefore && onLoadMore && (
                    <div className="flex justify-center my-2">
                        <button
                            onClick={onLoadMore}
                            className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 shadow-xs transition-all"
                        >
                            Load older messages
                        </button>
                    </div>
                )}

                {messages.map((msg) => {
                    const isOwnMessage = msg.user_id === currentUserId;
                    const isVoiceNote = msg.attachments?.some(
                        (att: any) => att.file_type?.startsWith("audio/") || att.original_name?.contains?.("voice_note") || att.file_name?.includes("voice_note")
                    );

                    return (
                        <div
                            key={msg.id}
                            id={`message-${msg.id}`}
                            className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} group relative`}
                        >
                            <div className="flex items-end gap-2 max-w-[75%]">
                                {!isOwnMessage && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
                                        {getInitials(msg.user?.name || "User")}
                                    </div>
                                )}

                                <div className="relative group">
                                    {/* Context Popover Menu */}
                                    <MessageContextMenu
                                        message={msg}
                                        isOwnMessage={isOwnMessage}
                                        quickEmojis={QUICK_EMOJIS}
                                        onReply={(m) => setReplyingTo(m)}
                                        onToggleReaction={onToggleReaction}
                                        onToggleStar={onToggleStarMessage}
                                        onEdit={(m) => {
                                            setEditingMessage({ id: m.id, body: m.body });
                                            onInputTextChange(m.body);
                                        }}
                                        onDeleteForMe={onDeleteForMe}
                                        onDeleteForAll={onDeleteForAll}
                                    />

                                    {/* Message Bubble Container */}
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 shadow-xs transition-all ${isOwnMessage
                                                ? "bg-blue-600 text-white rounded-br-xs"
                                                : "bg-white dark:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 rounded-bl-xs"
                                            }`}
                                    >
                                        {!isOwnMessage && (
                                            <p className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                                                {msg.user?.name}
                                            </p>
                                        )}

                                        {/* Voice Player or Text */}
                                        {isVoiceNote ? (
                                            <VoicePlayerCard
                                                url={msg.attachments[0].download_url}
                                                isMe={isOwnMessage}
                                            />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed select-text">{msg.body}</p>
                                        )}

                                        {/* Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && !isVoiceNote && (
                                            <div className="mt-2 space-y-1.5">
                                                {msg.attachments.map((att: any) => (
                                                    <div
                                                        key={att.id}
                                                        onClick={() => setPreviewAttachment(att)}
                                                        className="flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                                                    >
                                                        <FileText className="h-4 w-4 shrink-0" />
                                                        <span className="text-xs truncate max-w-[180px] font-medium">{att.original_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Timestamp & Star Status */}
                                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                                            {msg.is_starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                                            <span>{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <MessageComposer
                conversation={conversation}
                currentUserId={currentUserId}
                inputText={inputText}
                isSending={isSending}
                onInputTextChange={onInputTextChange}
                handleSendMessage={handleSendMessage}
                typingUsers={typingUsers}
                onTyping={onTyping}
                recordingUsers={recordingUsers}
                onRecording={onRecording}
                editingMessage={editingMessage}
                onCancelEditing={() => setEditingMessage(null)}
                onUnblockUser={onUnblockUser}
            />

            {/* Attachment Preview Modal */}
            {previewAttachment && (
                <AttachmentPreview
                    url={previewAttachment.download_url}
                    fileName={previewAttachment.original_name}
                    fileType={previewAttachment.file_type}
                />
            )}
        </div>
    );
}
