"use client";

import type { ChangeEvent } from "react";
import { Check, FileText, Loader2, Paperclip, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Comment } from "@/features/comments/types";
import { AttachmentPreview, DraftAttachmentPreview, formatFileSize } from "./attachment-preview";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface CommentsThreadProps {
    comments: Comment[];
    isLoadingComments: boolean;
    editingCommentId: string | null;
    editingCommentDraft: string;
    editingExistingAttachments: Comment["attachments"];
    editingNewAttachments: File[];
    isUpdatingComment: boolean;
    deletingCommentId: string | null;
    replyingToCommentId: string | null;
    replyDraft: string;
    isSubmittingReply: boolean;
    maxAttachments: number;
    getInitials: (value?: string) => string;
    getCommentReplies: (comment: Comment) => Comment[];
    setEditingCommentDraft: (value: string) => void;
    setReplyingToCommentId: (value: string | null) => void;
    setReplyDraft: (value: string) => void;
    startEditingComment: (comment: Comment) => void;
    cancelEditingComment: () => void;
    handleDeleteComment: (commentId: string) => void;
    handleUpdateComment: (commentId: string) => void;
    handleSubmitReply: (parentId: string) => void;
    handleEditFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
    removeEditingExistingAttachment: (attachmentId: string) => void;
    removeEditingNewAttachment: (index: number) => void;
}

export function CommentsThread({
    comments,
    isLoadingComments,
    editingCommentId,
    editingCommentDraft,
    editingExistingAttachments,
    editingNewAttachments,
    isUpdatingComment,
    deletingCommentId,
    replyingToCommentId,
    replyDraft,
    isSubmittingReply,
    maxAttachments,
    getInitials,
    getCommentReplies,
    setEditingCommentDraft,
    setReplyingToCommentId,
    setReplyDraft,
    startEditingComment,
    cancelEditingComment,
    handleDeleteComment,
    handleUpdateComment,
    handleSubmitReply,
    handleEditFilesSelected,
    removeEditingExistingAttachment,
    removeEditingNewAttachment,
}: CommentsThreadProps) {
    const renderCommentNode = (comment: Comment, depth = 0) => (
        <div
            key={comment.id}
            className={`rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03] ${depth > 0 ? "mt-3" : ""}`}
            style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 24}px` : undefined }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <UserAvatar
                        name={comment.author?.name}
                        avatarUrl={(comment.author as any)?.avatar_url || (comment.author as any)?.avatar}
                        size="sm"
                    />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                                {comment.author?.name || "Unknown user"}
                            </span>
                            {comment.author?.username && (
                                <span className="truncate text-xs text-zinc-500">@{comment.author.username}</span>
                            )}
                        </div>
                        <div className="text-xs text-zinc-500">
                            {new Date(comment.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>
                {(comment.can_update || comment.can_delete) && (
                    <div className="flex items-center gap-1">
                        {comment.can_update && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                onClick={() => startEditingComment(comment)}
                                disabled={isUpdatingComment || deletingCommentId === comment.id}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        {comment.can_delete && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-zinc-500 hover:text-red-600"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={isUpdatingComment || deletingCommentId === comment.id}
                            >
                                {deletingCommentId === comment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {editingCommentId === comment.id ? (
                <div className="mt-3 space-y-3">
                    <textarea
                        value={editingCommentDraft}
                        onChange={(event) => setEditingCommentDraft(event.target.value)}
                        className="min-h-[96px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
                    />
                    <div className="space-y-3">
                        {(editingExistingAttachments.length > 0 || editingNewAttachments.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {editingExistingAttachments.map((attachment) => (
                                    <div
                                        key={`existing-${attachment.id}`}
                                        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="max-w-[160px] truncate">{attachment.file_name}</span>
                                        <span className="text-zinc-500">{formatFileSize(attachment.file_size)}</span>
                                        <button
                                            type="button"
                                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                            onClick={() => removeEditingExistingAttachment(attachment.id)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {editingNewAttachments.map((file, index) => (
                                    <div
                                        key={`new-${file.name}-${file.lastModified}-${index}`}
                                        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="max-w-[160px] truncate">{file.name}</span>
                                        <span className="text-zinc-500">{formatFileSize(file.size)}</span>
                                        <button
                                            type="button"
                                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                            onClick={() => removeEditingNewAttachment(index)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="space-y-3">
                            {editingExistingAttachments.map((attachment) => (
                                <AttachmentPreview
                                    key={`existing-preview-${attachment.id}`}
                                    url={attachment.download_url}
                                    fileName={attachment.file_name}
                                    fileType={attachment.file_type}
                                />
                            ))}
                            {editingNewAttachments.map((file, index) => (
                                <DraftAttachmentPreview
                                    key={`edit-preview-${file.name}-${file.lastModified}-${index}`}
                                    file={file}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                id={`edit-comment-files-${comment.id}`}
                                accept=".jpg,.jpeg,.png,.pdf,.docx,.mp4"
                                onChange={handleEditFilesSelected}
                            />
                            <label
                                htmlFor={`edit-comment-files-${comment.id}`}
                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                            >
                                <Paperclip className="h-4 w-4" />
                                Add attachments
                            </label>
                            <span className="text-xs text-zinc-500">Max {maxAttachments} files, 10MB each</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg"
                            onClick={cancelEditingComment}
                            disabled={isUpdatingComment}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={isUpdatingComment || !editingCommentDraft.trim()}
                        >
                            {isUpdatingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className="comment-content mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200"
                    dangerouslySetInnerHTML={{
                        __html: comment.formatted_content || comment.content,
                    }}
                />
            )}

            {editingCommentId !== comment.id && comment.attachments?.length > 0 && (
                <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {comment.attachments.map((attachment) => (
                            <a
                                key={attachment.id}
                                href={attachment.download_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-zinc-200 dark:hover:bg-white/5"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                                <span className="max-w-[180px] truncate">{attachment.file_name}</span>
                                <span className="text-zinc-500">{formatFileSize(attachment.file_size)}</span>
                            </a>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {comment.attachments.map((attachment) => (
                            <AttachmentPreview
                                key={`preview-${attachment.id}`}
                                url={attachment.download_url}
                                fileName={attachment.file_name}
                                fileType={attachment.file_type}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    onClick={() => {
                        setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id);
                        setReplyDraft("");
                    }}
                >
                    Reply
                </Button>
            </div>

            {replyingToCommentId === comment.id && (
                <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-[#0f0f0f]">
                    <textarea
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        placeholder={`Reply to ${comment.author?.name || "comment"}...`}
                        className="min-h-[80px] w-full resize-y border-none bg-transparent text-sm text-zinc-900 outline-none dark:text-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setReplyingToCommentId(null);
                                setReplyDraft("");
                            }}
                            disabled={isSubmittingReply}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={isSubmittingReply || !replyDraft.trim()}
                        >
                            {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Reply
                        </Button>
                    </div>
                </div>
            )}

            {getCommentReplies(comment).length > 0 && (
                <div className="mt-3 space-y-3">
                    {getCommentReplies(comment).map((reply) => renderCommentNode(reply, depth + 1))}
                </div>
            )}
        </div>
    );

    if (isLoadingComments) {
        return (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading comments...
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-white/10">
                No comments yet.
            </div>
        );
    }

    return <>{comments.map((comment) => renderCommentNode(comment))}</>;
}
