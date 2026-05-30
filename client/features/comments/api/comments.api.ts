import { apiClient } from "@/shared/api/apiClient";
import { Comment, CreateCommentInput, ListTaskCommentsResponse, UpdateCommentInput } from "../types";

function buildCommentFormData(input: CreateCommentInput): FormData {
    const formData = new FormData();
    formData.append("task_id", input.taskId);
    formData.append("content", input.content);

    if (input.parentId) {
        formData.append("parent_id", input.parentId);
    }

    input.attachments?.forEach((file) => {
        formData.append("attachments[]", file);
    });

    return formData;
}

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
    const response = await apiClient.getPaginated<ListTaskCommentsResponse>(`/comments/task/${taskId}`);
    return response.data.comments || [];
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
    const response = await apiClient.post<{ comment: Comment }>("/comments", buildCommentFormData(input));
    return response.comment;
}

function buildUpdateCommentFormData(input: UpdateCommentInput): FormData {
    const formData = new FormData();
    formData.append("content", input.content);

    input.existingAttachmentIds?.forEach((attachmentId) => {
        formData.append("attachments[]", attachmentId);
    });

    input.newAttachments?.forEach((file) => {
        formData.append("attachments[]", file);
    });

    return formData;
}

export async function updateComment(commentId: string, input: UpdateCommentInput): Promise<Comment> {
    const response = await apiClient.put<{ comment: Comment }>(`/comments/${commentId}`, buildUpdateCommentFormData(input));
    return response.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
}
