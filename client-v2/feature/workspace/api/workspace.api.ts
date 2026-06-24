import { apiClient } from "@/shared/api/apiClient";
import { CreateWorkspaceInput, deleteWorkspaceResponse, GetWorkspaceResponse,  leaveWorkspaceResponse, Workspace } from "../types";

export async function getWorkspaces(): Promise<GetWorkspaceResponse> {
  const response = await apiClient.get<GetWorkspaceResponse>("/workspaces");
  return response;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
name:string): Promise<Workspace> {
  const response = await apiClient.post<{workspace: Workspace}>("/workspaces", {
    name
  });
  return response.workspace;
}


// get current workspace
export async function getCurrentWorkspace(): Promise<Workspace> {
  const response = await apiClient.get<Workspace>("/workspaces/current");
  return response;
}

// update current workspace
export async function updateCurrentWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
  const response = await apiClient.patch<Workspace>("/workspaces/current", {
    data: input,
  });
  return response;
}

// delete current workspace
export async function deleteCurrentWorkspace(): Promise<deleteWorkspaceResponse> {
  const response = await apiClient.delete<deleteWorkspaceResponse>("/workspaces/current");
  return response;
}

// leave current workspace

export async function leaveCurrentWorkspace(): Promise<leaveWorkspaceResponse> {
  const response = await apiClient.post<leaveWorkspaceResponse>("/workspaces/current/leave");
  return response;
}
