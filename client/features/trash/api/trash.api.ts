import { apiClient } from "@/shared/api/apiClient";
import { 
    TrashListResponse, 
    RestoreResponse, 
    ForceDeleteResponse, 
    EmptyTrashResponse 
} from "../types";

export async function getTrashedItems(type?: string): Promise<TrashListResponse> {
    const query = type && type !== 'all' ? `?type=${type}` : '';
    const response = await apiClient.get<TrashListResponse>(`/trash${query}`);
    return response;
}

export async function restoreTrashedItem(type: string, id: number | string): Promise<RestoreResponse> {
    const response = await apiClient.post<RestoreResponse>(`/trash/${type}/${id}/restore`);
    return response;
}

export async function forceDeleteTrashedItem(type: string, id: number | string): Promise<ForceDeleteResponse> {
    const response = await apiClient.delete<ForceDeleteResponse>(`/trash/${type}/${id}/force`);
    return response;
}

export async function emptyTrash(): Promise<EmptyTrashResponse> {
    const response = await apiClient.delete<EmptyTrashResponse>("/trash/empty");
    return response;
}

