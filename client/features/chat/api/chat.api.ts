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

export interface MessagesResponse {
    data: Message[];
    has_before?: boolean;
    has_after?: boolean;
    current_page?: number;
    last_page?: number;
}

export async function getMessages(
    conversationId: number,
    params?: number | GetMessagesParams
): Promise<MessagesResponse> {
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

    const response = await apiClient.getPaginated<MessagesResponse>(url);
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

export async function getConversationInfo(conversationId: number): Promise<{
    conversation: {
        id: number;
        name: string | null;
        type: "direct" | "group" | "project";
        project?: { id: number; name: string } | null;
        created_at: string;
    };
    participants: {
        id: number;
        user_id: number;
        role: "owner" | "admin" | "member";
        user: { id: number; name: string; email: string; avatar_url: string | null };
    }[];
    media_attachments: {
        id: number;
        message_id: number;
        original_name: string;
        file_type: string;
        file_size: number;
        download_url: string;
        created_at: string;
    }[];
    document_attachments: {
        id: number;
        message_id: number;
        original_name: string;
        file_type: string;
        file_size: number;
        download_url: string;
        created_at: string;
    }[];
    groups_in_common: {
        id: number;
        name: string;
        type: string;
        created_at: string;
    }[];
}> {
    return await apiClient.get(`/conversations/${conversationId}/info`);
}

export async function addGroupParticipants(
    conversationId: number,
    userIds: number[]
): Promise<any> {
    return await apiClient.post(`/conversations/${conversationId}/participants`, {
        user_ids: userIds,
    });
}

export async function removeGroupParticipant(
    conversationId: number,
    userId: number
): Promise<any> {
    return await apiClient.delete(`/conversations/${conversationId}/participants/${userId}`);
}

export async function updateParticipantRole(
    conversationId: number,
    participantId: number,
    role: "owner" | "admin" | "member"
): Promise<any> {
    return await apiClient.put(`/conversations/${conversationId}/participants/${participantId}/role`, {
        role,
    });
}

export async function updateGroupDetails(
    conversationId: number,
    data: { name?: string; description?: string }
): Promise<any> {
    return await apiClient.put(`/conversations/${conversationId}`, data);
}

export async function updateUserCustomStatus(custom_status: string): Promise<any> {
    return await apiClient.put('/auth/profile/status', { custom_status });
}

export async function clearConversation(conversationId: number): Promise<any> {
    return await apiClient.post(`/conversations/${conversationId}/clear`);
}

export async function deleteConversation(conversationId: number): Promise<any> {
    return await apiClient.delete(`/conversations/${conversationId}`);
}

export async function muteConversation(
    conversationId: number,
    durationMinutes: number | null
): Promise<any> {
    return await apiClient.post(`/conversations/${conversationId}/mute`, {
        duration_minutes: durationMinutes,
    });
}

export async function toggleStarMessage(
    conversationId: number,
    messageId: number
): Promise<{ is_starred: boolean }> {
    return await apiClient.post(`/conversations/${conversationId}/messages/${messageId}/star`);
}

export async function getStarredMessages(conversationId: number): Promise<any[]> {
    return await apiClient.get(`/conversations/${conversationId}/starred`);
}

export async function blockUser(blockedUserId: number): Promise<any> {
    return await apiClient.post(`/users/block`, {
        blocked_user_id: blockedUserId,
    });
}

export async function unblockUser(blockedUserId: number): Promise<any> {
    return await apiClient.delete(`/users/unblock/${blockedUserId}`);
}



