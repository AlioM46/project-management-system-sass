import { apiClient } from "@/shared/api/apiClient";
import { Workspace, CreateWorkspaceInput } from "../types";

/**
 * Fetches all workspaces that the currently logged-in user belongs to.
 * We use this to determine if the user has 0 workspaces (needs onboarding)
 * or to populate the Workspace Switcher dropdown.
 */
export async function getWorkspaces(): Promise<{ workspaces: Workspace[], count: number }> {
    // Sends a GET request to the /workspaces endpoint.
    // The backend returns an array of Workspace objects.
    const response = await apiClient.get<{ workspaces: Workspace[], count: number }>("/workspaces");
    console.log("Workspaces fetched successfully:", response.workspaces);
    return response;
}

/**
 * Creates a new workspace with the given name.
 * 
 * @param data The input containing the 'name' of the workspace.
 * @returns The newly created Workspace object.
 */
export async function createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
    // Sends a POST request with the new workspace data.
    const response = await apiClient.post<{ workspace: Workspace }>("/workspaces", data);

    // Depending on the exact Laravel backend response structure, 
    // it might return the workspace directly, or wrap it in a 'workspace' property.
    // Assuming it's wrapped in a 'workspace' property based on standard API patterns.
    // If the backend returns the workspace directly, we can just return `response as Workspace`.
    // Let's handle both just in case:
    return (response.workspace || response) as Workspace;
}
