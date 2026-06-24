import { apiClient } from "@/shared/api/apiClient";
import { Task } from "../types";

interface TaskFilters {
    project_id?: string | number;
    status?: string;
    assignee_id?: string | number;
    sort_by?: string;
    sort_dir?: string;
    page?: string | number;
    per_page?: string | number;
}

export async function getTasks(filters?: TaskFilters): Promise<{ tasks: Task[] }> {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.append(key, String(value));
            }
        });
    }

    const url = params.toString() ? `/tasks?${params.toString()}` : "/tasks";
    const response = await apiClient.get<{ tasks: Task[] }>(url);
    return response;
}
