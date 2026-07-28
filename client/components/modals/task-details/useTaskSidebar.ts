"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getTaskTransitions, updateTask } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types";

interface UseTaskSidebarOptions {
    onUpdate?: () => void;
    onCloseAssignees: () => void;
    task: Task;
}

export function useTaskSidebar({ onCloseAssignees, onUpdate, task }: UseTaskSidebarOptions) {
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [allowedTransitions, setAllowedTransitions] = useState<string[]>([]);
    const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
    const sidebarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const closeDropdowns = (event: globalThis.MouseEvent) => {
            if (sidebarRef.current?.contains(event.target as Node)) {
                return;
            }

            setIsStatusOpen(false);
            setIsPriorityOpen(false);
            onCloseAssignees();
        };

        document.addEventListener("click", closeDropdowns);
        return () => document.removeEventListener("click", closeDropdowns);
    }, [onCloseAssignees]);

    async function openStatusMenu() {
        setIsLoadingTransitions(true);

        try {
            const response = await getTaskTransitions(task.id);
            setAllowedTransitions(response.allowed_transitions);
        } catch {
            setAllowedTransitions([]);
            toast.error("Failed to load allowed transitions.");
        } finally {
            setIsLoadingTransitions(false);
        }
    }

    async function handleStatusChange(status: Task["status"]) {
        await updateTask(task.id, { status });
        onUpdate?.();
    }

    async function handlePriorityChange(priority: Task["priority"]) {
        await updateTask(task.id, { priority });
        onUpdate?.();
    }

    return {
        allowedTransitions,
        handlePriorityChange,
        handleStatusChange,
        isLoadingTransitions,
        isPriorityOpen,
        isStatusOpen,
        openStatusMenu,
        setIsPriorityOpen,
        setIsStatusOpen,
        sidebarRef,
    };
}
