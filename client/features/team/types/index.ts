export interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    role: {
        id: string;
        workspace_id: string;
        name: string;
        description?: string | null;
        is_system: boolean;
    };
    joined_at: string;
    user?: {
        id: string;
        name: string;
        username: string;
        email: string;
        avatar?: string;
    };
}

export interface SendInviteInput {
    email: string;
    role: 'admin' | 'member' | 'guest';
}
