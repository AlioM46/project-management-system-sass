"use client";

import { ApiError } from "@/shared/api/ApiError";
import { Task } from "@/features/tasks/types";

export const MAX_COMMENT_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_COMMENT_ATTACHMENTS = 10;

export interface AssigneeSummary {
    id: string;
    name: string;
    email: string;
}

export function getInitials(value?: string): string {
    if (!value) {
        return "U";
    }

    return value
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        return error.getFriendlyMessage() || fallback;
    }

    return fallback;
}

export function normalizeAssigneeId(value: string | number | null | undefined): string {
    return value == null ? "" : String(value);
}

export function mapTaskAssignees(task: Task): AssigneeSummary[] {
    return (task.assignees || []).map((assignee) => ({
        id: normalizeAssigneeId(assignee.id),
        name: assignee.name,
        email: assignee.email,
    }));
}
