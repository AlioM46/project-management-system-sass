export interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    joined_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

export interface SendInviteInput {
    email: string;
    role: 'admin' | 'member' | 'guest';
}
