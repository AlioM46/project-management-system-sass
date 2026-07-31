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
    messageId?: number,
    attachments?: File[]
): Promise<Message> {
    if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append("body", body || "");
        if (messageId) {
            formData.append("message_id", String(messageId));
        }
        attachments.forEach((file) => {
            formData.append("attachments[]", file);
        });
        return await apiClient.post<Message>(`/conversations/${conversationId}/messages`, formData);
    }

    return await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
        body,
        message_id: messageId,
    });
}

export async function toggleMessageReaction(
    conversationId: number,
    messageId: number,
    emoji: string
): Promise<any> {
    return await apiClient.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, {
        emoji,
    });
}
