"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { toast } from "sonner";
import { Task } from "@/features/tasks/types";
import { Member } from "@/features/team/types";
import { Comment } from "@/features/comments/types";
import { ApiError } from "@/shared/api/ApiError";
import { getTaskTransitions, replaceTaskAssignees, updateTask } from "@/features/tasks/api/tasks.api";
import { getMembers } from "@/features/team/api/team.api";
import { createComment, deleteComment, getCommentsByTask, updateComment as updateTaskComment } from "@/features/comments/api/comments.api";
import { TaskDetailsHeader } from "./task-details/TaskDetailsHeader";
import { CommentsComposer } from "./task-details/CommentsComposer";
import { CommentsThread } from "./task-details/CommentsThread";
import { TaskDetailsSidebar } from "./task-details/TaskDetailsSidebar";

const MAX_COMMENT_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_COMMENT_ATTACHMENTS = 10;

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onUpdate?: () => void;
}

function getInitials(value?: string): string {
    if (!value) {
        return "U";
    }

    return value
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        return error.getFriendlyMessage() || fallback;
    }

    return fallback;
}

export function TaskDetailsModal({ isOpen, onClose, task, onUpdate }: TaskDetailsModalProps) {
    if (!isOpen || !task) {
        return null;
    }

    return <TaskDetailsModalContent key={task.id} onClose={onClose} onUpdate={onUpdate} task={task} />;
}

interface TaskDetailsModalContentProps {
    onClose: () => void;
    task: Task;
    onUpdate?: () => void;
}

interface AssigneeSummary {
    id: string;
    name: string;
    email: string;
}

function normalizeAssigneeId(value: string | number | null | undefined): string {
    return value == null ? "" : String(value);
}

function mapTaskAssignees(task: Task): AssigneeSummary[] {
    return (task.assignees || []).map((assignee) => ({
        id: normalizeAssigneeId(assignee.id),
        name: assignee.name,
        email: assignee.email,
    }));
}

function TaskDetailsModalContent({ onClose, task, onUpdate }: TaskDetailsModalContentProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [isSaving, setIsSaving] = useState(false);

    const [members, setMembers] = useState<Member[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<AssigneeSummary[]>(() => mapTaskAssignees(task));
    const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
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

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isAssigneesOpen, setIsAssigneesOpen] = useState(false);
    const [allowedTransitions, setAllowedTransitions] = useState<string[]>([]);
    const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const sidebarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        getMembers().then((res) => setMembers(res.members || [])).catch(() => { });
    }, []);

    useEffect(() => {
        void loadComments(task.id);
    }, [task.id]);

    useEffect(() => {
        const closeDropdowns = (event: globalThis.MouseEvent) => {
            if (sidebarRef.current?.contains(event.target as Node)) {
                return;
            }

            setIsStatusOpen(false);
            setIsPriorityOpen(false);
            setIsAssigneesOpen(false);
        };

        document.addEventListener("click", closeDropdowns);
        return () => document.removeEventListener("click", closeDropdowns);
    }, []);

    useEffect(() => {
        if (title === task.title && description === (task.description || "")) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            void (async () => {
                if (!title.trim() || (title === task.title && description === (task.description || ""))) {
                    return;
                }

                setIsSaving(true);

                try {
                    await updateTask(task.id, { title, description });
                    toast.success("Task updated.");
                    onUpdate?.();
                } catch {
                    toast.error("Failed to update task.");
                } finally {
                    setIsSaving(false);
                }
            })();
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [description, onUpdate, task.description, task.id, task.title, title]);

    const mentionCandidates = members.filter((member) => {
        const username = member.user?.username?.toLowerCase();
        return Boolean(username && username.includes(mentionQuery.toLowerCase()));
    }).slice(0, 6);

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

    async function saveTaskDraft(currentTitle: string, currentDesc: string) {
        if (!currentTitle.trim() || (currentTitle === task.title && currentDesc === (task.description || ""))) {
            return;
        }

        setIsSaving(true);

        try {
            await updateTask(task.id, { title: currentTitle, description: currentDesc });
            toast.success("Task updated.");
            onUpdate?.();
        } catch {
            toast.error("Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    }

    function handleForceClose() {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (title !== task.title || description !== (task.description || "")) {
            void saveTaskDraft(title, description);
        }

        onClose();
    }

    async function toggleAssignee(memberUserId: string) {
        const normalizedMemberUserId = normalizeAssigneeId(memberUserId);
        const currentAssignedUsers = assignedUsers;
        const currentAssigneeIds = currentAssignedUsers.map((assignee) => assignee.id);
        const nextAssigneeIds = currentAssigneeIds.includes(normalizedMemberUserId)
            ? currentAssigneeIds.filter((id) => id !== normalizedMemberUserId)
            : [...currentAssigneeIds, normalizedMemberUserId];
        const nextAssignedUsers = nextAssigneeIds.map((userId) => {
            const existingAssignee = currentAssignedUsers.find((assignee) => assignee.id === userId);

            if (existingAssignee) {
                return existingAssignee;
            }

            const matchingMember = members.find((member) => normalizeAssigneeId(member.user_id) === userId);

            return {
                id: userId,
                name: matchingMember?.user?.name || "Unknown user",
                email: matchingMember?.user?.email || "",
            };
        });

        setAssignedUsers(nextAssignedUsers);
        setIsUpdatingAssignees(true);

        try {
            const updatedTask = await replaceTaskAssignees(task.id, nextAssigneeIds);
            setAssignedUsers(mapTaskAssignees(updatedTask));
            toast.success("Assignees updated.");
            onUpdate?.();
        } catch (error) {
            setAssignedUsers(currentAssignedUsers);
            toast.error(getApiErrorMessage(error, "Failed to update assignees."));
        } finally {
            setIsUpdatingAssignees(false);
        }
    }

    const assignedUserIds = assignedUsers.map((assignee) => assignee.id);

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

        setMentionQuery(query);
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

        const nextValue = `${commentDraft.slice(0, mentionRange.start)}@${username} ${commentDraft.slice(mentionRange.end)}`;
        const nextCaret = mentionRange.start + username.length + 2;

        setCommentDraft(nextValue);
        setIsMentionOpen(false);
        setMentionQuery("");
        setMentionRange(null);

        requestAnimationFrame(() => {
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
        const nextFiles = Array.from(event.target.files || []);

        if (nextFiles.length > 0) {
            const validFiles = validateAttachmentBatch(commentFiles.length, nextFiles);

            if (validFiles.length > 0) {
                setCommentFiles((current) => [...current, ...validFiles]);
            }
        }

        event.target.value = "";
    }

    function handleEditFilesSelected(event: ChangeEvent<HTMLInputElement>) {
        const nextFiles = Array.from(event.target.files || []);

        if (nextFiles.length > 0) {
            const validFiles = validateAttachmentBatch(editingExistingAttachments.length + editingNewAttachments.length, nextFiles);

            if (validFiles.length > 0) {
                setEditingNewAttachments((current) => [...current, ...validFiles]);
            }
        }

        event.target.value = "";
    }

    function handleRemoveDraftFile(index: number) {
        setCommentFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }

    function removeEditingExistingAttachment(attachmentId: string) {
        setEditingExistingAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
    }

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

    async function openStatusMenu() {
        setIsLoadingTransitions(true);

        try {
            const response = await getTaskTransitions(task.id);
            setAllowedTransitions(response.allowed_transitions);
        } catch {
            setAllowedTransitions([]);
            toast.error("Failed to load allowed transitions.");
        } finally {
            setIsLoadingTransitions(false);
        }
    }

    async function handleStatusChange(status: Task["status"]) {
        await updateTask(task.id, { status });
        onUpdate?.();
    }

    async function handlePriorityChange(priority: Task["priority"]) {
        await updateTask(task.id, { priority });
        onUpdate?.();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleForceClose} />
            <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0a] sm:h-[80vh]">
                <TaskDetailsHeader
                    taskId={task.id}
                    projectId={task.project_id}
                    isSaving={isSaving}
                    onClose={handleForceClose}
                />

                <div className="flex flex-1 flex-col overflow-y-auto md:flex-row">
                    <div className="flex-1 space-y-6 p-6 md:border-r md:border-zinc-200 dark:md:border-white/10">
                        <div>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full border-none bg-transparent text-2xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300 focus:ring-0 dark:text-white dark:placeholder:text-zinc-700"
                                placeholder="Task title"
                            />
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">Description</h3>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Add a more detailed description..."
                                className="min-h-[150px] w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
                            />
                        </div>

                        <div className="border-t border-zinc-200 pt-6 dark:border-white/10">
                            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Activity & Comments</h3>

                            <CommentsComposer
                                commentDraft={commentDraft}
                                commentFiles={commentFiles}
                                mentionCandidates={mentionCandidates}
                                isMentionOpen={isMentionOpen}
                                isSubmittingComment={isSubmittingComment}
                                maxAttachments={MAX_COMMENT_ATTACHMENTS}
                                onCommentChange={handleCommentChange}
                                onCommentClick={handleCommentClick}
                                onCommentKeyUp={handleCommentKeyUp}
                                onMentionSelect={handleMentionSelect}
                                onFilesSelected={handleFilesSelected}
                                onRemoveDraftFile={handleRemoveDraftFile}
                                onSubmitComment={handleSubmitComment}
                                commentInputRef={commentInputRef}
                                fileInputRef={fileInputRef}
                                getInitials={getInitials}
                            />

                            <div className="mt-5 space-y-3">
                                <CommentsThread
                                    comments={comments}
                                    isLoadingComments={isLoadingComments}
                                    editingCommentId={editingCommentId}
                                    editingCommentDraft={editingCommentDraft}
                                    editingExistingAttachments={editingExistingAttachments}
                                    editingNewAttachments={editingNewAttachments}
                                    isUpdatingComment={isUpdatingComment}
                                    deletingCommentId={deletingCommentId}
                                    replyingToCommentId={replyingToCommentId}
                                    replyDraft={replyDraft}
                                    isSubmittingReply={isSubmittingReply}
                                    maxAttachments={MAX_COMMENT_ATTACHMENTS}
                                    getInitials={getInitials}
                                    getCommentReplies={getCommentReplies}
                                    setEditingCommentDraft={setEditingCommentDraft}
                                    setReplyingToCommentId={setReplyingToCommentId}
                                    setReplyDraft={setReplyDraft}
                                    startEditingComment={startEditingComment}
                                    cancelEditingComment={cancelEditingComment}
                                    handleDeleteComment={(commentId) => void handleDeleteComment(commentId)}
                                    handleUpdateComment={(commentId) => void handleUpdateComment(commentId)}
                                    handleSubmitReply={(parentId) => void handleSubmitReply(parentId)}
                                    handleEditFilesSelected={handleEditFilesSelected}
                                    removeEditingExistingAttachment={removeEditingExistingAttachment}
                                    removeEditingNewAttachment={removeEditingNewAttachment}
                                />
                            </div>
                        </div>
                    </div>

                    <TaskDetailsSidebar
                        sidebarRef={sidebarRef}
                        task={task}
                        members={members}
                        assignedUserIds={assignedUserIds}
                        assignedUsers={assignedUsers}
                        allowedTransitions={allowedTransitions}
                        isLoadingTransitions={isLoadingTransitions}
                        isStatusOpen={isStatusOpen}
                        isPriorityOpen={isPriorityOpen}
                        isAssigneesOpen={isAssigneesOpen}
                        isUpdatingAssignees={isUpdatingAssignees}
                        assigneeSearchQuery={assigneeSearchQuery}
                        setIsStatusOpen={setIsStatusOpen}
                        setIsPriorityOpen={setIsPriorityOpen}
                        setIsAssigneesOpen={setIsAssigneesOpen}
                        setAssigneeSearchQuery={setAssigneeSearchQuery}
                        onOpenStatusMenu={() => void openStatusMenu()}
                        onStatusChange={(status) => void handleStatusChange(status)}
                        onPriorityChange={(priority) => void handlePriorityChange(priority)}
                        onToggleAssignee={(memberUserId) => void toggleAssignee(memberUserId)}
                    />
                </div>
            </div>
        </div>
    );
}
