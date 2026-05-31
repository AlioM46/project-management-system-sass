import { NotificationItem } from "../types";

function readString(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function getNotificationTitle(notification: NotificationItem) {
    switch (notification.type) {
        case "mentioned":
            return "You were mentioned";
        case "comment_replied":
            return "New reply";
        case "task_assigned":
            return "Task assigned";
        case "task_updated":
            return "Task updated";
        case "chat_message":
            return "New message";
        case "workspace_invite":
            return "Workspace invite";
        default:
            return "New notification";
    }
}

export function getNotificationDescription(notification: NotificationItem) {
    const message = readString(notification.data.message, "");

    if (message) {
        return message;
    }

    switch (notification.type) {
        case "mentioned":
            return "Someone mentioned you in a discussion.";
        case "comment_replied":
            return "Someone replied to your comment.";
        case "task_assigned":
            return "A task was assigned to you.";
        case "task_updated":
            return "A task you follow was updated.";
        case "chat_message":
            return "A new chat message needs your attention.";
        case "workspace_invite":
            return "You have a new workspace invitation.";
        default:
            return "There is new activity in your workspace.";
    }
}
