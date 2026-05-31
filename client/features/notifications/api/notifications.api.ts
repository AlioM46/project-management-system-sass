import { apiClient } from "@/shared/api/apiClient";
import { NotificationItem } from "../types";

export async function getNotifications(): Promise<NotificationItem[]> {
    return apiClient.get<NotificationItem[]>("/notifications");
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
    await apiClient.post("/notifications/read");
}
