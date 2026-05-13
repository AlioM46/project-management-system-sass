// This file defines the TypeScript interfaces (blueprints) for our Workspace data.

/**
 * Represents a Workspace object from the backend
 */
export interface Workspace {
    id: string;          // Unique identifier for the workspace
    name: string;        // The name of the workspace (e.g., "My Startup")
    created_at: string;  // When it was created
    updated_at: string;  // When it was last updated
}

/**
 * Data needed to create a new workspace
 */
export interface CreateWorkspaceInput {
    name: string;
}
