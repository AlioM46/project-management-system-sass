"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Save, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateProject, deleteProject } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types";
import { getErrorMessage } from "@/shared/api/ApiError";
import { useRouter } from "next/navigation";

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onProjectUpdated: () => void;
}

export function ProjectSettingsModal({
    isOpen,
    onClose,
    project,
    onProjectUpdated,
}: ProjectSettingsModalProps) {
    const router = useRouter();
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
        }
    }, [project]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Project name is required.");
            return;
        }

        setIsSaving(true);
        try {
            await updateProject(project.id, {
                name: name.trim(),
                description: description.trim() || undefined,
            });
            toast.success("Project settings updated!");
            onProjectUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to update project", error);
            toast.error(getErrorMessage(error, "Failed to update project settings."));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete the project "${project.name}"? All associated tasks will be removed.`)) return;

        setIsDeleting(true);
        try {
            await deleteProject(project.id);
            toast.success("Project deleted successfully.");
            onClose();
            router.push("/dashboard/projects");
        } catch (error) {
            console.error("Failed to delete project", error);
            toast.error(getErrorMessage(error, "Failed to delete project."));
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Project Settings</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Update project details or delete project</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-900 dark:text-white">Project Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-900 dark:text-white">Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the goals and scope of this project..."
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="p-4 bg-red-50/50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Danger Zone</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Deleting this project will permanently remove all tasks within it.
                        </p>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium"
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {isDeleting ? "Deleting..." : "Delete Project"}
                        </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-white/10">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving || isDeleting} className="rounded-xl text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || isDeleting || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm">
                            {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-1" /> Save Changes</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
