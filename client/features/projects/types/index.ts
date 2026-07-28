export interface Course {
    id: string;
    name: string;
    description?: string | null;
    workspace_id: string;
    price?: number | string;
    duration_hours?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    status?: "active";
}

export type Project = Course;

export interface CreateCourseInput {
    name: string;
    description?: string;
    price?: number;
    duration_hours?: number;
}

export type CreateProjectInput = CreateCourseInput;

export interface UpdateCourseInput {
    name?: string;
    description?: string;
    price?: number;
    duration_hours?: number;
}

export type UpdateProjectInput = UpdateCourseInput;
