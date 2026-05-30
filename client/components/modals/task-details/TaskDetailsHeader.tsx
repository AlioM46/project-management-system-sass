"use client";

import { CheckSquare, Loader2, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskDetailsHeaderProps {
    taskId: string;
    projectId?: string;
    isSaving: boolean;
    onClose: () => void;
}

export function TaskDetailsHeader({ taskId, projectId, isSaving, onClose }: TaskDetailsHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <CheckSquare className="h-4 w-4" />
                <span>Task-{taskId}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-white/5">
                    {projectId ? `Project #${projectId}` : "General"}
                </span>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                    <X className="h-4 w-4 text-zinc-500" />
                </Button>
            </div>
        </div>
    );
}
