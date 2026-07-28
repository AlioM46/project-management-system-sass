"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateTask } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types";

interface UseTaskDraftOptions {
    onClose: () => void;
    onUpdate?: () => void;
    task: Task;
}

export function useTaskDraft({ onClose, onUpdate, task }: UseTaskDraftOptions) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveTaskDraft = useCallback(async (currentTitle: string, currentDescription: string) => {
        if (!currentTitle.trim() || (currentTitle === task.title && currentDescription === (task.description || ""))) {
            return;
        }

        setIsSaving(true);

        try {
            await updateTask(task.id, { title: currentTitle, description: currentDescription });
            toast.success("Task updated.");
            onUpdate?.();
        } catch {
            toast.error("Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    }, [onUpdate, task.description, task.id, task.title]);

    useEffect(() => {
        if (title === task.title && description === (task.description || "")) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce typing so the modal saves after the user pauses briefly.
        saveTimeoutRef.current = setTimeout(() => {
            void saveTaskDraft(title, description);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [description, saveTaskDraft, task.description, task.title, title]);

    function handleForceClose() {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Flush unsaved title/description changes before the modal disappears.
        if (title !== task.title || description !== (task.description || "")) {
            void saveTaskDraft(title, description);
        }

        onClose();
    }

    return {
        description,
        handleForceClose,
        isSaving,
        setDescription,
        setTitle,
        title,
    };
}
