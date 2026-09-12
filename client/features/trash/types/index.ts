export type TrashedItemType = 'task' | 'project';

export interface TrashedItem {
    id: number | string;
    type: TrashedItemType;
    title: string;
    description?: string | null;
    status?: string;
    project_name?: string | null;
    project_id?: number | string | null;
    deleted_at: string;
    days_remaining: number;
    created_at?: string;
}

export interface TrashListResponse {
    total: number;
    items: TrashedItem[];
}

export interface RestoreResponse {
    restored: boolean;
    type: string;
    id: number | string;
    title: string;
    message: string;
    restored_tasks_count?: number;
}

export interface ForceDeleteResponse {
    deleted: boolean;
    type: string;
    id: number | string;
    message: string;
}

export interface EmptyTrashResponse {
    purged: boolean;
    total_purged: number;
    purged_tasks: number;
    purged_projects: number;
    message: string;
}

