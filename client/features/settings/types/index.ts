export interface AuditLog {
    id: number;
    workspace_id: number;
    actor_user_id: number | null;
    event_type: string;
    target_type: string | null;
    target_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent?: string | null;
    occurred_at: string;
    actor?: {
        name: string;
        email: string;
    };
}

export interface AuditLogFilters {
    from?: string;
    to?: string;
    event_type?: string;
    target_type?: string;
    actor_user_id?: string;
    assignee_user_id?: string;
    lead_id?: string;
    course_id?: string;
    per_page?: number;
}

export interface WorkspaceSettings {
    name: string;
    slug?: string;
    logo?: string;
}
