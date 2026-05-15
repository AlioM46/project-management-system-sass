export interface AuditLog {
    id: string;
    workspace_id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    changes: any;
    ip_address: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
}

export interface WorkspaceSettings {
    name: string;
    slug?: string;
    logo?: string;
}
