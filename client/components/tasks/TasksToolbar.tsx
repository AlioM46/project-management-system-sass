"use client";

import { Filter, MoreHorizontal, Plus, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/types";
import type { Member } from "@/features/team/types";

export interface TasksFilters {
  projectId: string;
  assigneeId: string;
  sortBy: string;
  sortDir: string;
}

interface TasksToolbarProps {
  projects: Project[];
  members: Member[];
  filters: TasksFilters;
  hasActiveFilters: boolean;
  onNewTask: () => void;
  onProjectChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  onClearFilters: () => void;
}

export function TasksToolbar({
  projects,
  members,
  filters,
  hasActiveFilters,
  onNewTask,
  onProjectChange,
  onAssigneeChange,
  onSortByChange,
  onSortDirChange,
  onClearFilters,
}: TasksToolbarProps) {
  return (
    <>
      <div className="mb-8 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            My Tasks
          </h2>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Create tasks, move them across statuses, and open any task for more
            details.
          </p>
        </div>

        <Button
          onClick={onNewTask}
          title={
            projects.length > 0
              ? "Create a new task in the To Do column"
              : "You need a project before creating tasks"
          }
          className="h-11 gap-2 rounded-xl bg-blue-600 px-6 text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="mb-6 flex shrink-0 flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="mr-2 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-zinc-400">
            Project
          </span>
          <select
            value={filters.projectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className="min-w-[150px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          >
            <option
              value=""
              className="dark:bg-zinc-900"
            >
              All Projects
            </option>
            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
                className="dark:bg-zinc-900"
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-zinc-400">
            Assignee
          </span>
          <div className="relative flex items-center">
            <Users className="absolute left-3 h-3.5 w-3.5 text-zinc-400" />
            <select
              value={filters.assigneeId}
              onChange={(event) => onAssigneeChange(event.target.value)}
              className="min-w-[150px] rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            >
              <option
                value=""
                className="dark:bg-zinc-900"
              >
                All Assignees
              </option>
              {members.map((member) => (
                <option
                  key={member.id}
                  value={member.user_id}
                  className="dark:bg-zinc-900"
                >
                  {member.user?.name || member.user?.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto h-9 gap-2 rounded-xl px-3 text-zinc-500 hover:text-red-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="mb-8 flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3 px-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <MoreHorizontal className="h-3 w-3" />
          <span>Sorting</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(event) => onSortByChange(event.target.value)}
            className="cursor-pointer border-none bg-transparent text-sm text-zinc-600 outline-none transition-colors hover:text-blue-500 focus:ring-0 dark:text-zinc-300"
          >
            <option
              value="created_at"
              className="dark:bg-zinc-900"
            >
              Creation Date
            </option>
            <option
              value="updated_at"
              className="dark:bg-zinc-900"
            >
              Last Updated
            </option>
            <option
              value="title"
              className="dark:bg-zinc-900"
            >
              Title
            </option>
            <option
              value="status"
              className="dark:bg-zinc-900"
            >
              Status
            </option>
          </select>
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-200 pl-4 dark:border-white/10">
          <span className="text-xs font-medium text-zinc-500">Order:</span>
          <select
            value={filters.sortDir}
            onChange={(event) => onSortDirChange(event.target.value)}
            className="cursor-pointer border-none bg-transparent text-sm text-zinc-600 outline-none transition-colors hover:text-blue-500 focus:ring-0 dark:text-zinc-300"
          >
            <option
              value="desc"
              className="dark:bg-zinc-900"
            >
              Descending
            </option>
            <option
              value="asc"
              className="dark:bg-zinc-900"
            >
              Ascending
            </option>
          </select>
        </div>
      </div>
    </>
  );
}
