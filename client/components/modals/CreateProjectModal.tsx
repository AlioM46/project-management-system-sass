"use client";

import { useState } from "react";
import { X, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProject } from "@/features/projects/api/projects.api";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createProject({ name, description });
            toast.success("Project created successfully!");
            setName("");
            setDescription("");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to create project:", error);
            toast.error(getErrorMessage(error, "Failed to create project."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">New Project</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                        <X className="h-5 w-5 text-zinc-500" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-white">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Website Redesign"
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-900 dark:text-white">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this project about?"
                            rows={3}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                        />
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md">
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
