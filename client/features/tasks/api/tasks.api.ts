import { apiClient } from "@/shared/api/apiClient";
import { Task, CreateTaskInput, UpdateTaskInput } from "../types";

export async function getTasks(filters?: { 
    project_id?: string | number, 
    status?: string, 
    assignee_id?: string | number,
    sort_by?: string,
    sort_dir?: string
}): Promise<{ tasks: Task[] }> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });
    }
    const url = params.toString() ? `/tasks?${params.toString()}` : "/tasks";
    const response = await apiClient.get<{ tasks: Task[] }>(url);
    return response;
}

export async function getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<{ task: Task }>(`/tasks/${taskId}`);
    return response.task || response;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>("/tasks", data);
    return response.task || response;
}

export async function updateTask(taskId: string, data: UpdateTaskInput): Promise<Task> {
    const response = await apiClient.patch<{ task: Task }>(`/tasks/${taskId}`, data);
    return response.task || response;
}

export async function deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
}

export async function replaceTaskAssignees(taskId: string, userIds: string[]): Promise<Task> {
    const response = await apiClient.put<{ task: Task }>(`/tasks/${taskId}/assignees`, { user_ids: userIds });
    return response.task || response;
}

export async function getTaskTransitions(taskId: string): Promise<{ current_status: string, allowed_transitions: string[] }> {
    const response = await apiClient.get<{ current_status: string, allowed_transitions: string[] }>(`/tasks/${taskId}/allowed-transitions`);
    return response;
}
