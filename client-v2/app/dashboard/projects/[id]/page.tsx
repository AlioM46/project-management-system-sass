"use client";

import Link from "next/link";
import React, { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  FolderKanban,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import ApiError from "@/shared/api/ApiError";
import { cn } from "@/lib/utils";
import { getProject, updateProject, deleteProject } from "@/feature/projects/api/projects.api";
import { getTasks } from "@/feature/tasks/api/tasks.api";
import { Project } from "@/feature/projects/types";
import { Task } from "@/feature/tasks/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: Task["status"]) {
  return status.replaceAll("_", " ");
}

function statusTone(status: Task["status"]) {
  if (status === "done") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }

  if (status === "in_progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  }

  if (status === "blocked") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
  }

  return "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300";
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.id ?? "");

  const [project, setProject] = React.useState<Project | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const fetchProjectData = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      setIsLoading(true);
      setNotFound(false);

      const [projectResponse, tasksResponse] = await Promise.all([
        getProject(projectId),
        getTasks({
          project_id: projectId,
          sort_by: "updated_at",
          sort_dir: "desc",
        }),
      ]);

      setProject(projectResponse);
      setTasks(tasksResponse.tasks ?? []);
      setName(projectResponse.name);
      setDescription(projectResponse.description ?? "");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setNotFound(true);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to load project details");
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProjectData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchProjectData]);

  const taskStats = React.useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] += 1;
        return acc;
      },
      {
        total: 0,
        todo: 0,
        in_progress: 0,
        blocked: 0,
        done: 0,
        cancelled: 0,
      },
    );
  }, [tasks]);

  const openEditDialog = () => {
    if (!project) {
      return;
    }

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

    if (!project) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedProject = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setProject(updatedProject);
      setName(updatedProject.name);
      setDescription(updatedProject.description ?? "");
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
    if (!project) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      toast.success("Project deleted successfully");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard/projects");
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

  if (notFound) {
    return (
      <div className="min-h-screen space-y-6 bg-[linear-gradient(180deg,#f6f8fb_0%,#eef2f7_100%)] p-4 md:p-8 dark:bg-[linear-gradient(180deg,#050505_0%,#090f19_100%)]">
        <Button
          asChild
          variant="ghost"
        >
          <Link href="/dashboard/projects">
            <ArrowLeft />
            Back to Projects
          </Link>
        </Button>

        <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
          <CardHeader>
            <CardTitle className="text-2xl text-zinc-900 dark:text-white">
              Project not found
            </CardTitle>
            <CardDescription>
              The requested project does not exist in the current workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-[linear-gradient(180deg,#f6f8fb_0%,#eef2f7_100%)] p-4 md:p-8 dark:bg-[linear-gradient(180deg,#050505_0%,#090f19_100%)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Button
            asChild
            variant="ghost"
            className="w-fit"
          >
            <Link href="/dashboard/projects">
              <ArrowLeft />
              Back to Projects
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-blue-500/25">
              <FolderKanban className="size-7" />
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <>
                  <div className="h-10 w-64 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-5 w-80 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {project?.name ?? "Project"}
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {project?.description?.trim()
                      ? project.description
                      : "No description yet. Add context so the team understands the purpose of this project."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={openEditDialog}
            disabled={isLoading || !project}
          >
            <Pencil />
            Edit Project
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading || !project}
          >
            <Trash2 />
            Delete Project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <div className="space-y-6">
          <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
            <CardHeader className="border-b border-zinc-200/70 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl text-zinc-900 dark:text-white">
                    Project Tasks
                  </CardTitle>
                  <CardDescription>
                    Work items currently assigned to this project.
                  </CardDescription>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  {taskStats.total} tasks
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5"
                    />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
                    <FolderKanban className="size-8 text-zinc-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    No tasks yet
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                    This project exists, but no tasks are linked to it yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200/70 dark:divide-white/10">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] md:flex-row md:items-start md:justify-between"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                              statusTone(task.status),
                            )}
                          >
                            {formatStatus(task.status)}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Updated {formatDate(task.updated_at)}
                          </span>
                        </div>
                        <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-white">
                          {task.title}
                        </h3>
                        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                          {task.description?.trim()
                            ? task.description
                            : "No task description provided."}
                        </p>
                      </div>

                      <div className="flex min-w-[180px] flex-col items-start gap-3 md:items-end">
                        <div className="flex flex-wrap justify-end gap-2">
                          {(task.assignees ?? []).length > 0 ? (
                            task.assignees?.slice(0, 3).map((assignee) => (
                              <span
                                key={assignee.id}
                                className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                              >
                                {assignee.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Unassigned
                            </span>
                          )}
                        </div>

                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                        >
                          <Link href="/dashboard/tasks">
                            View Tasks
                            <ArrowUpRight />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900 dark:text-white">
                Project Snapshot
              </CardTitle>
              <CardDescription>
                Quick summary for this project and its current workload.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { label: "Total Tasks", value: taskStats.total },
                { label: "Todo", value: taskStats.todo },
                { label: "In Progress", value: taskStats.in_progress },
                { label: "Done", value: taskStats.done },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-zinc-100/80 px-4 py-3 dark:bg-white/5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-200/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0d1118]">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-900 dark:text-white">
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Project ID
                </p>
                <p className="mt-2 rounded-xl bg-zinc-100/80 px-3 py-2 font-mono text-sm text-zinc-700 dark:bg-white/5 dark:text-zinc-200">
                  {project?.id ?? projectId}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Created
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                  {formatDate(project?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Updated
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-white">
                  {formatDate(project?.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <DialogContent className="sm:max-w-[460px] bg-white text-zinc-900 dark:bg-[#0d1118] dark:text-white">
          <DialogHeader>
            <DialogTitle>Update Project</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Adjust the project name or description.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={handleUpdate}
          >
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                placeholder="Project name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                placeholder="Project description"
              />
            </div>

            <DialogFooter className="mt-2">
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
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[460px] bg-white text-zinc-900 dark:bg-[#0d1118] dark:text-white">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Delete &quot;{project?.name ?? "this project"}&quot;? This will remove it from
              the active project list.
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
    </div>
  );
}
