"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { toast } from "sonner";
import { Comment } from "@/features/comments/types";
import { Member } from "@/features/team/types";
import { Task } from "@/features/tasks/types";
import {
    createComment,
    deleteComment,
    getCommentsByTask,
    updateComment as updateTaskComment,
} from "@/features/comments/api/comments.api";
import {
    getApiErrorMessage,
    MAX_COMMENT_ATTACHMENTS,
    MAX_COMMENT_ATTACHMENT_BYTES,
} from "./task-details.shared";

export function useTaskComments(task: Task, members: Member[]) {

    /*
    updateMentionState => Will prepare the comment text useStates, like {
        mentionQuery,
        mentionRange{start,end},
        isMentionOpen
    }
    
    handleCommentChange => Will handle the comment text change and update the mention state
    handleCommentClick => Will handle the comment text click and update the mention state
    handleCommentKeyUp => Will handle the comment text key up and update the mention state
    handleMentionSelect => Will handle the mention select and update the comment text
    e.g. => "Call @Ah" => after select user to mention
    => "Call @Ahmed " => then focus on the input field and 
    set the caret position after the mention and the space after it
    */

    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentDraft, setCommentDraft] = useState("");
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentDraft, setEditingCommentDraft] = useState("");
    const [editingExistingAttachments, setEditingExistingAttachments] = useState<Comment["attachments"]>([]);
    const [editingNewAttachments, setEditingNewAttachments] = useState<File[]>([]);
    const [isUpdatingComment, setIsUpdatingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
    const [isMentionOpen, setIsMentionOpen] = useState(false);

    const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        void loadComments(task.id);
    }, [task.id]);

    // When comment text changed ("With @ Sign") => Filter and return the members whose usernames match the query 
    const mentionCandidates = useMemo(
        () =>
            members
                .filter((member) => {
                    const username = member.user?.username?.toLowerCase();
                    return Boolean(username && username.includes(mentionQuery.toLowerCase()));
                })
                .slice(0, 6),
        [members, mentionQuery],
    );

    async function loadComments(taskId: string) {
        setIsLoadingComments(true);

        try {
            const nextComments = await getCommentsByTask(taskId);
            setComments(nextComments);
        } catch {
            toast.error("Failed to load comments.");
        } finally {
            setIsLoadingComments(false);
        }
    }

    function updateMentionState(value: string, caretPosition: number | null) {
        if (caretPosition === null) {
            setIsMentionOpen(false);
            setMentionRange(null);
            setMentionQuery("");
            return;
        }

        const beforeCursor = value.slice(0, caretPosition);
        const match = beforeCursor.match(/(^|\s)@([\w-]*)$/);

        if (!match) {
            setIsMentionOpen(false);
            setMentionRange(null);
            setMentionQuery("");
            return;
        }

        const query = match[2] || "";
        const mentionStart = beforeCursor.lastIndexOf("@");

        // "Call @Ahm" => 
        // match[0] => "Call @Ahm"
        // match[1] => " " => The Space Between Call And @
        // match[2] => "Ahm" => The Query We Are Looking For
        setMentionQuery(query);
        // "Call @Ahm" => { start: 5, end: 8 } => "@Ahm"
        setMentionRange({ start: mentionStart, end: caretPosition });
        setIsMentionOpen(true);
    }

    function handleCommentChange(event: ChangeEvent<HTMLTextAreaElement>) {
        const value = event.target.value;
        setCommentDraft(value);
        updateMentionState(value, event.target.selectionStart);
    }

    function handleCommentClick(event: MouseEvent<HTMLTextAreaElement>) {
        updateMentionState(commentDraft, event.currentTarget.selectionStart);
    }

    function handleCommentKeyUp(event: KeyboardEvent<HTMLTextAreaElement>) {
        updateMentionState(commentDraft, event.currentTarget.selectionStart);
    }

    function handleMentionSelect(username: string) {
        if (!mentionRange) {
            return;
        }

        // "برجاء مراجعة الكود يا " + "@saleh " + "وعمل دمج للمشروع."
        const nextValue = `${commentDraft.slice(0, mentionRange.start)}@${username} ${commentDraft.slice(mentionRange.end)}`;
        //  to make the caret Cursor stops after the Mention And The Space After it 
        // e.g. -> "Call @Ahmed {caret here}"  

        const nextCaret = mentionRange.start + username.length + 2;

        setCommentDraft(nextValue);
        setIsMentionOpen(false);
        setMentionQuery("");
        setMentionRange(null);

        requestAnimationFrame(() => {
            // requestAnimationFrame => Focus & Select Will Happen After Rendering
            // because it depends on the previous value, not the new value
            // which will cause a problem
            commentInputRef.current?.focus();
            commentInputRef.current?.setSelectionRange(nextCaret, nextCaret);
        });
    }

    function validateAttachmentBatch(existingCount: number, files: File[]): File[] {
        if (existingCount >= MAX_COMMENT_ATTACHMENTS) {
            toast.error(`You can upload up to ${MAX_COMMENT_ATTACHMENTS} attachments per comment.`);
            return [];
        }

        const validFiles: File[] = [];

        for (const file of files) {
            if (existingCount + validFiles.length >= MAX_COMMENT_ATTACHMENTS) {
                toast.error(`You can upload up to ${MAX_COMMENT_ATTACHMENTS} attachments per comment.`);
                break;
            }

            if (file.size > MAX_COMMENT_ATTACHMENT_BYTES) {
                toast.error(`${file.name} exceeds the 10MB limit.`);
                continue;
            }

            validFiles.push(file);
        }

        return validFiles;
    }

    function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {

        // represent the new files from <input type="file"/> 
        const nextFiles = Array.from(event.target.files || []);



        if (nextFiles.length > 0) {
            const validFiles = validateAttachmentBatch(commentFiles.length, nextFiles);


            // ValidFiles represent the NEW accepted-passed files
            if (validFiles.length > 0) {
                setCommentFiles((current) => [...current, ...validFiles]);
            }
        }


        // if chosen file name has changed, then you reselect it, 
        event.target.value = "";
    }

    function handleEditFilesSelected(event: ChangeEvent<HTMLInputElement>) {

        // represent the new files from <input type="file"/> 
        const nextFiles = Array.from(event.target.files || []);

        if (nextFiles.length > 0) {
            const validFiles = validateAttachmentBatch(editingExistingAttachments.length + editingNewAttachments.length, nextFiles);

            if (validFiles.length > 0) {
                setEditingNewAttachments((current) => [...current, ...validFiles]);
            }
        }

        event.target.value = "";
    }

    // for new comment
    function handleRemoveDraftFile(index: number) {
        setCommentFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }

    // for existing attachemnts in database
    function removeEditingExistingAttachment(attachmentId: string) {
        setEditingExistingAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
    }

    // for existing attachemnts, but not uploaded to server yet.
    function removeEditingNewAttachment(index: number) {
        setEditingNewAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }

    async function handleSubmitComment() {
        if (!commentDraft.trim()) {
            toast.error("Comment content is required.");
            return;
        }

        setIsSubmittingComment(true);

        try {
            await createComment({
                taskId: task.id,
                content: commentDraft.trim(),
                attachments: commentFiles,
            });

            // Reset the draft after the backend accepts the new comment.
            setCommentDraft("");
            setCommentFiles([]);
            setIsMentionOpen(false);
            setMentionQuery("");
            setMentionRange(null);

            await loadComments(task.id);
            toast.success("Comment added.");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to add comment."));
        } finally {
            setIsSubmittingComment(false);
        }
    }

    async function handleSubmitReply(parentId: string) {
        if (!replyDraft.trim()) {
            toast.error("Reply content is required.");
            return;
        }

        setIsSubmittingReply(true);

        try {
            await createComment({
                taskId: task.id,
                content: replyDraft.trim(),
                parentId,
            });

            setReplyingToCommentId(null);
            setReplyDraft("");
            await loadComments(task.id);
            toast.success("Reply added.");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to add reply."));
        } finally {
            setIsSubmittingReply(false);
        }
    }

    function startEditingComment(comment: Comment) {
        setEditingCommentId(comment.id);
        setEditingCommentDraft(comment.content);
        setEditingExistingAttachments(comment.attachments || []);
        setEditingNewAttachments([]);
    }

    function cancelEditingComment() {
        setEditingCommentId(null);
        setEditingCommentDraft("");
        setEditingExistingAttachments([]);
        setEditingNewAttachments([]);
    }

    async function handleUpdateComment(commentId: string) {
        if (!editingCommentDraft.trim()) {
            toast.error("Comment content is required.");
            return;
        }

        setIsUpdatingComment(true);

        try {
            await updateTaskComment(commentId, {
                content: editingCommentDraft.trim(),
                existingAttachmentIds: editingExistingAttachments.map((attachment) => attachment.id),
                newAttachments: editingNewAttachments,
            });
            await loadComments(task.id);
            cancelEditingComment();
            toast.success("Comment updated.");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to update comment."));
        } finally {
            setIsUpdatingComment(false);
        }
    }

    async function handleDeleteComment(commentId: string) {
        setDeletingCommentId(commentId);

        try {
            await deleteComment(commentId);

            if (editingCommentId === commentId) {
                cancelEditingComment();
            }

            if (replyingToCommentId === commentId) {
                setReplyingToCommentId(null);
                setReplyDraft("");
            }

            await loadComments(task.id);
            toast.success("Comment deleted.");
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Failed to delete comment."));
        } finally {
            setDeletingCommentId(null);
        }
    }

    function getCommentReplies(comment: Comment): Comment[] {
        return comment.recursive_replies || comment.recursiveReplies || [];
    }

    return {
        commentDraft,
        commentFiles,
        commentInputRef,
        comments,
        fileInputRef,
        deletingCommentId,
        editingCommentDraft,
        editingCommentId,
        editingExistingAttachments,
        editingNewAttachments,
        getCommentReplies,
        handleCommentChange,
        handleCommentClick,
        handleCommentKeyUp,
        handleDeleteComment,
        handleEditFilesSelected,
        handleFilesSelected,
        handleMentionSelect,
        handleRemoveDraftFile,
        handleSubmitComment,
        handleSubmitReply,
        handleUpdateComment,
        isLoadingComments,
        isMentionOpen,
        isSubmittingComment,
        isSubmittingReply,
        isUpdatingComment,
        mentionCandidates,
        removeEditingExistingAttachment,
        removeEditingNewAttachment,
        replyDraft,
        replyingToCommentId,
        setEditingCommentDraft,
        setReplyDraft,
        setReplyingToCommentId,
        startEditingComment,
        cancelEditingComment,
    };
}
