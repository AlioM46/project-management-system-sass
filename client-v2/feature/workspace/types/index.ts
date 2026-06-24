import { apiClient } from "@/shared/api/apiClient";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface CreateWorkspaceInput {
  name: string;
}

export interface WorkspaceOwner {
  id: string;
  name: string;
  email: string;
}

export interface GetWorkspace {
  id: string; 
  name: string;
  members_count: number;


//   


}

export interface GetWorkspaceResponse {
  count: number;
  workspaces: GetWorkspace[];
}

export interface Workspace {
  id: string;
  name: string;
  created_by_user_id: number;
  members_count: number;
  owner: WorkspaceOwner;
  created_at: string;
  updated_at: string;
}

export interface deleteWorkspaceResponse {
  workspace: {
    id: string;
    delete_at: string;
  }
}


export interface leaveWorkspaceResponse {
action:string;
  workspace: {
    id: string;
    delete_at: string;
  }
}