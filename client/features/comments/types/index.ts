export interface CommentAttachment {
    id: string;
    object_key: string;
    original_name?: string | null;
    file_name: string;
    file_type: string;
    file_size: number;
    download_url?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CommentAuthor {
    id: string;
    name: string;
    username?: string;
    email: string;
}

export interface Comment {
    id: string;
    lead_id: string;
    task_id?: string;
    author_id: string;
    parent_id?: string | null;
    content: string;
    formatted_content?: string;
    can_update?: boolean;
    can_delete?: boolean;
    created_at: string;
    updated_at: string;
    author?: CommentAuthor;
    attachments: CommentAttachment[];
    recursiveReplies?: Comment[];
    recursive_replies?: Comment[];
}

export interface CreateCommentInput {
    leadId?: string;
    taskId?: string;
    content: string;
    attachments?: File[];
    parentId?: string;
}

export interface UpdateCommentInput {
    content: string;
    existingAttachmentIds?: string[];
    newAttachments?: File[];
}

export interface ListLeadCommentsResponse {
    comments: Comment[];
    count: number;
}
