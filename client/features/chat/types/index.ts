export interface User {
    id: number;
    name: string;
    username?: string;
    email?: string;
    avatar_url: string | null;
}

export interface Participant {
    id: number;
    conversation_id: number;
    user_id: number;
    role: 'owner' | 'participant';
    is_active: boolean;
    joined_at: string;
    user: User;
}

export interface Conversation {
    id: number;
    workspace_id: number;
    project_id: number | null;
    name: string | null;
    type: 'direct' | 'project' | 'group';
    created_at: string;
    updated_at: string;
    project?: {
        id: number;
        name: string;
    };
    participants?: Participant[];
    unread_count?: number;
    last_message?: Message | null;
}

export interface MessageReaction {
    id: number;
    message_id: number;
    user_id: number;
    emoji: string;
    user?: {
        id: number;
        name: string;
    };
}

export interface Message {
    id: number;
    workspace_id: number;
    conversation_id: number;
    message_id: number | null; // Nested reply ID (threading)
    body: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    sender: User;
    replies?: Message[]; // Threading support
    parent?: Message;
    reactions?: MessageReaction[];
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
}
