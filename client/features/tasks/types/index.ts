export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
    priority: 'low' | 'medium' | 'high';
    project_id?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    assignees?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    }[];
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
    priority?: 'low' | 'medium' | 'high';
    project_id?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
    priority?: 'low' | 'medium' | 'high';
    project_id?: string | null;
}
