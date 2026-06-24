"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { replaceTaskAssignees } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types";
import {
    AssigneeSummary,
    getApiErrorMessage,
    mapTaskAssignees,
    normalizeAssigneeId,
} from "./task-details.shared";

interface UseTaskAssigneesOptions {
    onUpdate?: () => void;
    task: Task;
}

export function useTaskAssignees({ onUpdate, task }: UseTaskAssigneesOptions) {
    const [members, setMembers] = useState<Member[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<AssigneeSummary[]>(() => mapTaskAssignees(task));
    const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
    const [isAssigneesOpen, setIsAssigneesOpen] = useState(false);

    useEffect(() => {
        // Load the workspace member list once so the picker can assign/remove people.
        getMembers().then((res) => setMembers(res.members)).catch(() => { });
    }, []);

    const assignedUserIds = useMemo(
        () => assignedUsers.map((assignee) => assignee.id),
        [assignedUsers],
    );

    async function toggleAssignee(memberUserId: string) {
        const normalizedMemberUserId = normalizeAssigneeId(memberUserId);
        const currentAssignedUsers = assignedUsers;
        const currentAssigneeIds = currentAssignedUsers.map((assignee) => assignee.id);
        const nextAssigneeIds = currentAssigneeIds.includes(normalizedMemberUserId)
            ? currentAssigneeIds.filter((id) => id !== normalizedMemberUserId)
            : [...currentAssigneeIds, normalizedMemberUserId];
        const nextAssignedUsers = nextAssigneeIds.map((userId) => {
            const existingAssignee = currentAssignedUsers.find((assignee) => assignee.id === userId);

            if (existingAssignee) {
                return existingAssignee;
            }

            const matchingMember = members.find((member) => normalizeAssigneeId(member.user_id) === userId);

            return {
                id: userId,
                name: matchingMember?.user?.name || "Unknown user",
                email: matchingMember?.user?.email || "",
            };
        });

        // Show the assignee change immediately, then persist it in the backend.
        setAssignedUsers(nextAssignedUsers);
        setIsUpdatingAssignees(true);

        try {
            const updatedTask = await replaceTaskAssignees(task.id, nextAssigneeIds);
            setAssignedUsers(mapTaskAssignees(updatedTask));
            toast.success("Assignees updated.");
            onUpdate?.();
        } catch (error) {
            setAssignedUsers(currentAssignedUsers);
            toast.error(getApiErrorMessage(error, "Failed to update assignees."));
        } finally {
            setIsUpdatingAssignees(false);
        }
    }

    return {
        assignedUserIds,
        assignedUsers,
        assigneeSearchQuery,
        isAssigneesOpen,
        isUpdatingAssignees,
        members,
        setAssigneeSearchQuery,
        setIsAssigneesOpen,
        toggleAssignee,
    };
}
