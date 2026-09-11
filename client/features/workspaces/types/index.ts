// This file defines the TypeScript interfaces (blueprints) for our Workspace data.

export interface WorkspaceRole {
    id: number | null;
    name: string;
    slug: string;
}

/**
 * Represents a Workspace object from the backend
 */
export interface Workspace {
    id: string | number;         // Unique identifier for the workspace
    name: string;                // The name of the workspace (e.g., "My Startup")
    members_count?: number;      // Total number of members
    role?: WorkspaceRole | null; // The authenticated user's role in this workspace
    created_at?: string;         // When it was created
    updated_at?: string;         // When it was last updated
}

/**
 * Data needed to create a new workspace
 */
export interface CreateWorkspaceInput {
    name: string;
}

