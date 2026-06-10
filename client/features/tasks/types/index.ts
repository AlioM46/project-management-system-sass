export interface LeadStageSummary {
    id: string | number;
    name: string;
    position?: number;
    is_success?: boolean;
}

export interface Lead {
    id: string;
    title: string;
    description?: string | null;
    phone?: string | null;
    source?: string | null;
    lost_reason?: string | null;
    course_id?: string;
    stage_id?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    status: string;
    priority: "low" | "medium" | "high";
    project_id?: string;
    course?: {
        id: string;
        name: string;
    };
    stage?: LeadStageSummary;
    assignees?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    }[];
    student?: {
        id: string | number;
        student_code: string;
        academic_status: string;
    } | null;
}

export type Task = Lead;

export interface CreateLeadInput {
    title: string;
    description?: string;
    phone?: string;
    source?: string;
    course_id?: string;
    stage_id?: string | number;
    assignee_ids?: string[];
}

export interface UpdateLeadInput {
    title?: string;
    description?: string;
    phone?: string | null;
    source?: string;
    lost_reason?: string | null;
    course_id?: string | null;
    stage_id?: string | number | null;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: string;
    priority?: "low" | "medium" | "high";
    project_id?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: string;
    priority?: "low" | "medium" | "high";
    project_id?: string | null;
    lost_reason?: string | null;
    phone?: string | null;
    source?: string | null;
}
