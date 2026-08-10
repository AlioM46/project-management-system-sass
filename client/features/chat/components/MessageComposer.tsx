"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, Trash2, Pause, Play, Loader2, X, Ban, Info, FileText } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { getFileIcon, formatFileSize } from "../utils/chatHelpers";

interface MessageComposerProps {
    conversation: any | null;
    currentUserId: number;
    inputText: string;
    isSending: boolean;
    onInputTextChange: (text: string) => void;
    handleSendMessage: (body: string, conversationId: number, messageId?: number, attachments?: File[]) => Promise<void>;
    typingUsers?: { id: number; name: string }[];
    onTyping?: (isTyping: boolean) => void;
    recordingUsers?: { id: number; name: string }[];
    onRecording?: (isRecording: boolean) => void;
    editingMessage?: { id: number; body: string } | null;
    onCancelEditing?: () => void;
    onUnblockUser?: (userId: number) => Promise<void>;
}

function SelectedFilePreviewCard({ file, onRemove }: { file: File; onRemove: () => void }) {
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

    return (
        <div className="relative group h-16 w-16 bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 shadow-sm flex items-center justify-center overflow-hidden">
            {isImage && previewUrl ? (
                <img src={previewUrl} alt={file.name} className="h-full w-full object-cover rounded-xl" />
            ) : isVideo && previewUrl ? (
                <video src={previewUrl} className="h-full w-full object-cover rounded-xl" />
            ) : (
                <div className="flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-xl">{getFileIcon(file.type, file.name)}</span>
                    <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 truncate max-w-[50px] mt-0.5">
                        {file.name}
                    </span>
                </div>
            )}

            <button
                onClick={onRemove}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 shadow-xs"
                title="Remove attachment"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}

export function MessageComposer({
    conversation,
    currentUserId,
    inputText,
    isSending,
    onInputTextChange,
    handleSendMessage,
    typingUsers = [],
    onTyping,
    recordingUsers = [],
    onRecording,
    editingMessage,
    onCancelEditing,
    onUnblockUser,
}: MessageComposerProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        isRecording,
        isPaused,
        audioLevels,
        formattedTime,
        startRecording: rawStartRecording,
        pauseRecording,
        resumeRecording,
        stopRecording: rawStopRecording,
        cancelRecording: rawCancelRecording,
    } = useAudioRecorder();

    const startRecording = async () => {
        await rawStartRecording();
        if (onRecording) {
            onRecording(true);
        }
    };

    const stopRecording = () => {
        rawStopRecording();
        if (onRecording) {
            onRecording(false);
        }
    };

    const cancelRecording = () => {
        rawCancelRecording();
        if (onRecording) {
            onRecording(false);
        }
    };

    const handleTextChange = (text: string) => {
        onInputTextChange(text);

        if (onTyping && text.trim().length > 0) {
            onTyping(true);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 2500);
        } else if (onTyping && text.trim().length === 0) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            onTyping(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArray]);
        }
        if (e.target) e.target.value = "";
    };

    const handleSend = async () => {
        if ((!inputText.trim() && selectedFiles.length === 0) || !conversation) return;
        const textToSend = inputText.trim();
        const filesToSend = [...selectedFiles];
        setSelectedFiles([]);
        if (onTyping) onTyping(false);

        await handleSendMessage(textToSend, conversation.id, undefined, filesToSend);
    };

    return (
        <div className="p-4 bg-white dark:bg-white/5 border-t border-zinc-200 dark:border-white/10 shrink-0">
            {/* Editing Bar */}
            {editingMessage && (
                <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg flex items-center justify-between">
                    <div className="text-xs">
                        <span className="font-semibold text-amber-700 dark:text-amber-300">Editing Message</span>
                        <p className="text-zinc-600 dark:text-zinc-400 truncate max-w-md">{editingMessage.body}</p>
                    </div>
                    <button onClick={onCancelEditing} className="text-zinc-400 hover:text-zinc-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Typing Indicator Banner */}
            {typingUsers.length > 0 && (
                <div className="px-3 py-1 mb-1 text-xs text-zinc-500 dark:text-zinc-400 italic flex items-center gap-2">
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
                <div className="mb-2.5 p-3 bg-zinc-100/90 dark:bg-zinc-800/90 border-l-4 border-blue-500 rounded-r-2xl shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span>Attached Files ({selectedFiles.length})</span>
                        <button
                            onClick={() => setSelectedFiles([])}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            Clear all
                        </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {selectedFiles.map((file, idx) => (
                            <SelectedFilePreviewCard
                                key={idx}
                                file={file}
                                onRemove={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Block Banners or Standard Composer */}
            {conversation?.is_blocked_by_me ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <Ban className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>You have blocked this contact. Unblock to send messages.</span>
                    </div>
                    {onUnblockUser && (
                        <button
                            onClick={() => {
                                const partner = conversation?.participants?.find((p: any) => (p.user_id || p.user?.id || p.id) !== currentUserId);
                                const partnerUserId = partner ? (partner.user_id || partner.user?.id || partner.id) : null;
                                if (partnerUserId) onUnblockUser(partnerUserId);
                            }}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
                        >
                            Unblock
                        </button>
                    )}
                </div>
            ) : conversation?.is_blocked_by_partner ? (
                <div className="p-3.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 shadow-xs">
                    <Info className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span>You cannot send messages to this contact.</span>
                </div>
            ) : isRecording ? (
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-800/90 border border-red-500/30 dark:border-red-500/40 rounded-2xl px-4 py-2.5 shadow-md">
                    <button
                        onClick={cancelRecording}
                        className="h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors shrink-0"
                        title="Delete recording"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${isPaused ? "" : "animate-ping"}`} />
                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{formattedTime}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-[2.5px] h-6 overflow-hidden px-2">
                        {audioLevels.map((level, idx) => (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-100 ${isPaused ? "bg-zinc-300 dark:bg-zinc-600" : "bg-red-500"}`}
                                style={{ height: `${level}%`, minHeight: "15%" }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0 ${isPaused ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300"}`}
                        title={isPaused ? "Resume" : "Pause"}
                    >
                        {isPaused ? <Play className="h-3.5 w-3.5 ml-0.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={stopRecording}
                        className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shrink-0 shadow-sm"
                        title="Send Voice Note"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            ) : (
                <div className="flex items-end gap-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500/50 transition-all">
                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 mb-0.5 ${selectedFiles.length > 0 ? "text-blue-500 bg-blue-500/10" : ""}`}
                    >
                        <Paperclip className="h-4 w-4 text-zinc-400" />
                    </button>
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
                        className="flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none py-1.5 max-h-32 overflow-y-auto"
                        disabled={isSending}
                    />
                    <button className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0 mb-0.5">
                        <Smile className="h-4 w-4 text-zinc-400" />
                    </button>
                    {inputText.trim() || selectedFiles.length > 0 ? (
                        <button
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${!isSending ? "bg-blue-600 hover:bg-blue-700 shadow-sm" : "bg-blue-600/70 cursor-not-allowed"}`}
                            onClick={handleSend}
                            disabled={isSending}
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shrink-0 mb-0.5 shadow-sm"
                            title="Record Voice Message"
                        >
                            <Mic className="h-4 w-4 text-white" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
