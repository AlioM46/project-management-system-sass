"use client";

import Link from "next/link";
import React from "react";
import { Pencil, Trash2, FolderKanban, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProject, updateProject } from "../api/projects.api";
import { Project } from "../types";
import { toast } from "sonner";
import ApiError from "@/shared/api/ApiError";

interface ProjectItemProps {
  project: Project;
  onChanged: () => Promise<void> | void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const ProjectItem = ({ project, onChanged }: ProjectItemProps) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(
    project.description ?? "",
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const openEditDialog = () => {
    setName(project.name);
    setDescription(project.description ?? "");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (name.trim() === "") {
      toast.error("Project name is required");
      return;
    }

    try {
      setIsSaving(true);
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      await onChanged();
      toast.success("Project updated successfully");
      setIsEditOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update project");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      await onChanged();
      toast.success("Project deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete project");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#0d1118]">
        <CardHeader className="border-b border-zinc-200/70 pb-4 dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <FolderKanban className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Project
              </p>
              <CardTitle className="mt-1 truncate text-lg font-semibold text-zinc-900 dark:text-white">
                {project.name}
              </CardTitle>
            </div>
          </div>
          <CardAction className="flex gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={openEditDialog}
              disabled={isSaving || isDeleting}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isSaving || isDeleting}
            >
              <Trash2 />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="min-h-12 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {project.description?.trim()
              ? project.description
              : "No description yet. Add context so the team knows what this project is for."}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="rounded-xl bg-zinc-100/80 px-3 py-2 dark:bg-white/5">
              <p className="uppercase tracking-[0.18em]">Created</p>
              <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {formatDate(project.created_at)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-100/80 px-3 py-2 dark:bg-white/5">
              <p className="uppercase tracking-[0.18em]">Updated</p>
              <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {formatDate(project.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-zinc-200/70 dark:border-white/10">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Workspace project
          </span>
          <Button
            asChild
            size="sm"
            variant="ghost"
          >
            <Link href={`/dashboard/projects/${project.id}`}>
              Open
              <ArrowUpRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[460px] bg-white text-zinc-900 dark:bg-[#0d1118] dark:text-white">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Delete &quot;{project.name}&quot;? This will remove it from the active
              projects list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <DialogContent className="sm:max-w-[460px] bg-white text-zinc-900 dark:bg-[#0d1118] dark:text-white">
          <DialogHeader>
            <DialogTitle>Update Project</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Change the project name or description, then save to refresh the
              list.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={handleUpdate}
          >
            <div className="grid gap-2">
              <Label htmlFor={`project-name-${project.id}`}>Project Name</Label>
              <Input
                id={`project-name-${project.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                placeholder="Project name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`project-description-${project.id}`}>
                Description
              </Label>
              <Input
                id={`project-description-${project.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                placeholder="Project description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectItem;
