"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/types";
import type { Task } from "@/features/tasks/types";

interface InlineTaskCreateCardProps {
    status: Task["status"];
    title: string;
    selectedProjectId: string;
    projects: Project[];
    onTitleChange: (value: string) => void;
    onProjectChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>, status: Task["status"]) => void;
    onCancel: () => void;
}

export function InlineTaskCreateCard({
    status,
    title,
    selectedProjectId,
    projects,
    onTitleChange,
    onProjectChange,
    onSubmit,
    onCancel,
}: InlineTaskCreateCardProps) {
    return (
        <div className="mt-2 rounded-2xl border border-blue-500 bg-white p-3 shadow-sm dark:bg-[#0f0f0f]">
            <form onSubmit={(event) => onSubmit(event, status)} className="flex flex-col gap-2">
                <input
                    type="text"
                    autoFocus
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Task name..."
                    className="w-full border-none bg-transparent text-sm text-zinc-900 outline-none focus:ring-0 dark:text-white"
                />

                <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-white/5">
                    <select
                        value={selectedProjectId}
                        onChange={(event) => onProjectChange(event.target.value)}
                        className="max-w-[120px] rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                    >
                        {projects.map((project) => (
                            <option key={project.id} value={project.id} className="truncate">
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" className="h-6 rounded bg-blue-600 px-2 text-xs text-white hover:bg-blue-700">
                            Save
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
