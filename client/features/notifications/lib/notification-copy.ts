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
        case "lead_assigned":
            return "Lead assigned";
        case "lead_updated":
            return "Lead updated";
        case "lead_converted":
            return "Lead converted";
        case "student_created":
            return "Student created";
        case "whatsapp_send_failed":
            return "WhatsApp failed";
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
        case "lead_assigned":
            return "A lead was assigned to you.";
        case "lead_updated":
            return "A lead you follow was updated.";
        case "lead_converted":
            return "A lead moved into the student lifecycle.";
        case "student_created":
            return "A new student record was created.";
        case "whatsapp_send_failed":
            return "An enrollment WhatsApp message failed to send.";
        case "chat_message":
            return "A new chat message needs your attention.";
        case "workspace_invite":
            return "You have a new workspace invitation.";
        default:
            return "There is new activity in your workspace.";
    }
}
