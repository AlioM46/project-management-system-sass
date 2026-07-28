import { apiClient } from "@/shared/api/apiClient";
import { Conversation, Message, PaginatedResponse } from "../types";



export async function getConversations(): Promise<Conversation[]> {
    return await apiClient.get<Conversation[]>("/conversations");
}

export async function createConversation(
    type: "direct" | "group",
    userIds: number[],
    name?: string
): Promise<Conversation> {
    return await apiClient.post<Conversation>("/conversations", {
        type,
        user_ids: userIds,
        name,
    });
}


export async function getMessages(
    conversationId: number,
    page: number = 1
): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.getPaginated<PaginatedResponse<Message>>(
        `/conversations/${conversationId}/messages?page=${page}`
    );
    return response.data;
}



export async function sendMessage(
    conversationId: number,
    body: string,
    messageId?: number
): Promise<Message> {
    return await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
        body,
        message_id: messageId,
    });
}
