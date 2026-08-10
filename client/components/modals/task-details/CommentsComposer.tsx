"use client";

import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Member } from "@/features/team/types";
import { DraftAttachmentPreview, formatFileSize } from "./attachment-preview";

interface CommentsComposerProps {
    commentDraft: string;
    commentFiles: File[];
    mentionCandidates: Member[];
    isMentionOpen: boolean;
    isSubmittingComment: boolean;
    maxAttachments: number;
    onCommentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onCommentClick: (event: MouseEvent<HTMLTextAreaElement>) => void;
    onCommentKeyUp: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    onMentionSelect: (username: string) => void;
    onFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemoveDraftFile: (index: number) => void;
    onSubmitComment: () => void;
    commentInputRef: RefObject<HTMLTextAreaElement | null>;
    fileInputRef: RefObject<HTMLInputElement | null>;
    getInitials: (value?: string) => string;
}

import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getMe } from "@/features/auth/api/auth.api";
import { User } from "@/features/auth/types";

export function CommentsComposer({
    commentDraft,
    commentFiles,
    mentionCandidates,
    isMentionOpen,
    isSubmittingComment,
    maxAttachments,
    onCommentChange,
    onCommentClick,
    onCommentKeyUp,
    onMentionSelect,
    onFilesSelected,
    onRemoveDraftFile,
    onSubmitComment,
    commentInputRef,
    fileInputRef,
    getInitials,
}: CommentsComposerProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        getMe().then(setCurrentUser).catch(() => { });
    }, []);

    const avatarUrl = currentUser?.avatar_url || currentUser?.avatar;

    return (
        <div className="flex items-start gap-3">
            <UserAvatar name={currentUser?.name} avatarUrl={avatarUrl} size="sm" className="mt-1" />
            <div className="flex-1 overflow-visible rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-blue-500 dark:border-white/10 dark:bg-[#0f0f0f]">
                <div className="relative">
                    <textarea
                        ref={commentInputRef}
                        value={commentDraft}
                        onChange={onCommentChange}
                        onClick={onCommentClick}
                        onKeyUp={onCommentKeyUp}
                        placeholder="Write a comment or type @ to mention..."
                        className="min-h-[90px] w-full resize-y border-none bg-transparent p-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
                    />

                    {isMentionOpen && mentionCandidates.length > 0 && (
                        <div className="absolute left-3 top-[calc(100%+4px)] z-30 w-64 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#101010]">
                            {mentionCandidates.map((member) => (
                                <button
                                    key={member.id}
                                    type="button"
                                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-white/5"
                                    onClick={() => onMentionSelect(member.user?.username || "")}
                                >
                                    <UserAvatar
                                        name={member.user?.name}
                                        avatarUrl={member.user?.avatar_url || member.user?.avatar}
                                        size="sm"
                                    />
                                    <div className="min-w-0">
                                        <div className="truncate text-zinc-900 dark:text-white">{member.user?.name}</div>
                                        <div className="truncate text-xs text-zinc-500">@{member.user?.username}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {commentFiles.length > 0 && (
                    <div className="space-y-3 border-t border-zinc-200 px-3 py-2 dark:border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {commentFiles.map((file, index) => (
                                <div
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                    className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="max-w-[160px] truncate">{file.name}</span>
                                    <span className="text-zinc-500">{formatFileSize(file.size)}</span>
                                    <button
                                        type="button"
                                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                        onClick={() => onRemoveDraftFile(index)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {commentFiles.map((file, index) => (
                                <DraftAttachmentPreview
                                    key={`draft-preview-${file.name}-${file.lastModified}-${index}`}
                                    file={file}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 p-2 dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf,.docx,.mp4"
                            onChange={onFilesSelected}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <div className="px-2 text-xs text-zinc-500">Max {maxAttachments} files, 10MB each</div>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isSubmittingComment || !commentDraft.trim()}
                        onClick={onSubmitComment}
                    >
                        {isSubmittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Comment
                    </Button>
                </div>
            </div>
        </div>
    );
}
