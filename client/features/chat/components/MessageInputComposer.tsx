import { Send, Paperclip, Smile, Loader2, Reply, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Message } from "../types";
import { SelectedFilePreviewCard } from "./SelectedFilePreviewCard";

interface MessageInputComposerProps {
    conversationId: number;
    isSending: boolean;
    inputText: string;
    onInputTextChange: (text: string) => void;
    replyingTo: Message | null;
    setReplyingTo: (msg: Message | null) => void;
    editingMessage: Message | null;
    setEditingMessage: (msg: Message | null) => void;
    typingUsers: { id: number; name: string }[];
    onTyping?: (isTyping: boolean) => void;
    onEditMessage?: (messageId: number, body: string) => Promise<void>;
    handleSendMessage: (body: string, conversationId: number, messageId?: number, attachments?: File[]) => Promise<void>;
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function MessageInputComposer({
    conversationId,
    isSending,
    inputText,
    onInputTextChange,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    typingUsers,
    onTyping,
    onEditMessage,
    handleSendMessage,
    textAreaRef
}: MessageInputComposerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
        if ((!hasText && !hasFiles) || isSending) return;

        if (onTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            onTyping(false);
        }

        if (editingMessage) {
            if (onEditMessage) {
                await onEditMessage(editingMessage.id, inputText.trim());
            }
            setEditingMessage(null);
            onInputTextChange("");
        } else {
            await handleSendMessage(inputText.trim(), conversationId, replyingTo?.id, selectedFiles);
            setReplyingTo(null);
            setSelectedFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const getFileIcon = (type: string): string => {
        if (type?.includes("zip") || type?.includes("rar")) return "ZIP";
        if (type?.includes("pdf")) return "PDF";
        if (type?.includes("word") || type?.includes("document")) return "DOC";
        if (type?.includes("excel") || type?.includes("sheet")) return "XLS";
        return "FILE";
    };

    return (
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

            {/* WhatsApp Web Style Editing-Message Quote Preview Banner */}
            {editingMessage && (
                <div className="mb-2.5 p-3 bg-amber-50/90 dark:bg-amber-950/20 border-l-[5px] border-amber-500 rounded-r-2xl shadow-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            <span>Editing Message</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 truncate mt-1 text-xs font-normal">{editingMessage.body}</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingMessage(null);
                            onInputTextChange("");
                        }}
                        className="h-7 w-7 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all shrink-0"
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
    );
}
