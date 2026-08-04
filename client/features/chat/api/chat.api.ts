import { apiClient } from "@/shared/api/apiClient";
import { Conversation, Message, MessageDeletion, PaginatedResponse } from "../types";



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


export interface GetMessagesParams {
    around_message_id?: number;
    before_message_id?: number;
    after_message_id?: number;
    page?: number;
}

export async function getMessages(
    conversationId: number,
    params?: number | GetMessagesParams
): Promise<PaginatedResponse<Message>> {
    const searchParams = new URLSearchParams();
    if (typeof params === "number") {
        searchParams.append("page", String(params));
    } else if (params) {
        if (params.around_message_id) searchParams.append("around_message_id", String(params.around_message_id));
        if (params.before_message_id) searchParams.append("before_message_id", String(params.before_message_id));
        if (params.after_message_id) searchParams.append("after_message_id", String(params.after_message_id));
        if (params.page) searchParams.append("page", String(params.page));
    }
    const queryString = searchParams.toString();
    const url = `/conversations/${conversationId}/messages` + (queryString ? `?${queryString}` : "");

    const response = await apiClient.getPaginated<PaginatedResponse<Message>>(url);
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


export async function updateMessage(conversationId: Number, MessageId: Number, body: string): Promise<Message> {
    return await apiClient.put<Message>(`/conversations/${conversationId}/messages/${MessageId}/updateForMe`, {
        body,
    });
}


export async function deleteMessageForMe(conversationId: Number, MessageId: Number): Promise<MessageDeletion> {
    return await apiClient.delete<MessageDeletion>(`/conversations/${conversationId}/messages/${MessageId}/deleteForMe`);
}

export async function deleteMessageForAll(conversationId: Number, MessageId: Number): Promise<Message> {
    return await apiClient.delete<Message>(`/conversations/${conversationId}/messages/${MessageId}/delete`);
}

export async function searchMessages(
    conversationId: number,
    query: string,
    page: number = 1
): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.getPaginated<PaginatedResponse<Message>>(
        `/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data;
}

