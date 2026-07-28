export interface TaskAssignee {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    status: "todo" | "in_progress" | "blocked" | "done" | "cancelled";
    project_id?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    completed_at?: string | null;
    assignees?: TaskAssignee[];
}
