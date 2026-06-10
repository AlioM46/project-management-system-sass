/**
 * # InlineCreateForm Component
 * 
 * This component renders a compact form inline inside a pipeline column.
 * It allows advisors to quickly register a new lead name and select the 
 * course they are interested in, then save directly on the board.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Course } from "@/features/projects/types";

interface InlineCreateFormProps {
    courseId: string;
    courses: Course[];
    leadTitle: string;
    onTitleChange: (val: string) => void;
    onCourseChange: (val: string) => void;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function InlineCreateForm({
    courseId,
    courses,
    leadTitle,
    onTitleChange,
    onCourseChange,
    onCancel,
    onSubmit,
}: InlineCreateFormProps) {
    return (
        <div className="bg-white dark:bg-[#0f0f0f] p-3 rounded-2xl border border-emerald-500 shadow-sm mt-2">
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
                <input
                    type="text"
                    autoFocus
                    value={leadTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Lead name (e.g. Student Name)..."
                    className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-white"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                    <select
                        value={courseId}
                        onChange={(e) => onCourseChange(e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-md py-1 px-2 text-zinc-600 dark:text-zinc-300 max-w-[120px]"
                    >
                        {courses.map(c => (
                            <option key={c.id} value={c.id} className="truncate">{c.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2" 
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            size="sm" 
                            className="h-6 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
