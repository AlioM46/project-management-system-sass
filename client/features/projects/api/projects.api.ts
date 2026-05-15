import { apiClient } from "@/shared/api/apiClient";
import { Project, CreateProjectInput, UpdateProjectInput } from "../types";

export async function getProjects(): Promise<{ projects: Project[] }> {
    const response = await apiClient.get<{ projects: Project[] }>("/projects");
    return response;
}

export async function getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get<{ project: Project }>(`/projects/${projectId}`);
    return response.project || response;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
    const response = await apiClient.post<{ project: Project }>("/projects", data);
    return response.project || response;
}

export async function updateProject(projectId: string, data: UpdateProjectInput): Promise<Project> {
    const response = await apiClient.patch<{ project: Project }>(`/projects/${projectId}`, data);
    return response.project || response;
}

export async function deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
}
