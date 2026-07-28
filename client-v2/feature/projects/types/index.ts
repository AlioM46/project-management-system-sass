export interface Project {
    id: string;
    name: string;
    description?: string;
    workspace_id: string;
    status: 'active' | 'archived' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
    status?: 'active' | 'archived' | 'completed';
}
