"use client";

import React, { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { createWorkspace } from "../api/workspace.api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

export function CreateWorkspaceModal() {
    const { isCreateModalOpen, setIsCreateModalOpen, refreshWorkspaces, switchWorkspace } = useWorkspace();
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (trimmedName.length < 3) {
            toast.error("Workspace name must be at least 3 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newWorkspace = await createWorkspace({ name: trimmedName });
            await refreshWorkspaces();
            await switchWorkspace(newWorkspace.id);
            setName("");
            setIsCreateModalOpen(false);
            toast.success(`Workspace "${newWorkspace.name}" created!`);
        } catch (error) {
            console.error("Failed to create workspace:", error);
            toast.error(getErrorMessage(error, "Failed to create workspace."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#0a0a0a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    Create Workspace
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Organize projects, tasks, and team members in a shared hub.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <Label htmlFor="workspace-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Workspace Name
                        </Label>
                        <Input
                            id="workspace-name"
                            placeholder="e.g. Acme Studio, Marketing Team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            autoFocus
                            className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus-visible:ring-blue-500"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={isSubmitting}
                            className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || name.trim().length < 3}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Create Workspace
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
