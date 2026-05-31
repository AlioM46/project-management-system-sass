export interface NotificationItem {
    id: number;
    type: string | null;
    data: Record<string, unknown>;
    workspace_id: number;
    user_id: number;
    read_at: string | null;
    created_at: string | null;
}

export interface NotificationState {
    items: NotificationItem[];
    unreadCount: number;
    isPanelOpen: boolean;
    isLoading: boolean;
    connectionStatus: "idle" | "connecting" | "connected" | "error";
}

export type RealtimeNotificationEvent = NotificationItem;
