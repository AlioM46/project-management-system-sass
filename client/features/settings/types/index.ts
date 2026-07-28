export interface AuditLog {
    id: number | string;
    workspace_id: number | string;
    actor_user_id?: number | string;
    event_type: string;
    target_type: string;
    target_id?: number | string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    occurred_at?: string;
    created_at?: string;
    actor?: {
        id: number | string;
        name: string;
        email: string;
    };
}

export interface WorkspaceSettings {
    name: string;
    slug?: string;
    logo?: string;
}
