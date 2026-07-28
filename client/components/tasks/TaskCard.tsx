"use client";

import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/features/tasks/types";

const STATUS_OPTIONS: Array<{ id: Task["status"]; label: string }> = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "DONE", label: "Done" },
  { id: "CANCELLED", label: "Cancelled" },
];

interface TaskCardProps {
  task: Task;
  index: number;
  allowedTransitions?: string[];
  onOpen: (taskId: string) => void;
  onLoadAllowedStatuses: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}

export function TaskCard({
  task,
  index,
  allowedTransitions,
  onOpen,
  onLoadAllowedStatuses,
  onStatusChange,
}: TaskCardProps) {
  return (
    <Draggable
      draggableId={String(task.id)}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          onClick={() => onOpen(String(task.id))}
          className={`group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#0f0f0f] ${
            snapshot.isDragging
              ? "z-50 rotate-1 scale-[1.02] opacity-80 shadow-xl ring-2 ring-blue-500"
              : ""
          }`}
        >
          <div
            className={`absolute bottom-0 left-0 top-0 w-1 ${
              task.priority === "high"
                ? "bg-red-500"
                : task.priority === "medium"
                  ? "bg-amber-500"
                  : "bg-blue-500"
            }`}
          />

          <div className="mb-2 flex items-start justify-between pl-2">
            <h4 className="line-clamp-2 font-medium text-zinc-900 dark:text-white">
              {task.title}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 -mr-2 -mt-1 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>

          {task.description && (
            <p className="mb-4 line-clamp-2 pl-2 text-sm text-zinc-500 dark:text-zinc-400">
              {task.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between pl-2">
            <div className="flex -space-x-2">
              {task.assignees?.slice(0, 3).map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-purple-500 to-pink-500 text-[10px] font-bold text-white dark:border-[#0f0f0f]"
                  title={assignee.name}
                >
                  {assignee.name.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>

            <select
              value={task.status}
              onClick={(event) => {
                event.stopPropagation();
                onLoadAllowedStatuses(String(task.id));
              }}
              onFocus={() => onLoadAllowedStatuses(String(task.id))}
              onChange={(event) => {
                event.stopPropagation();
                onStatusChange(
                  String(task.id),
                  event.target.value as Task["status"],
                );
              }}
              className="cursor-pointer rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {STATUS_OPTIONS.map((statusOption) => {
                const isAllowed = allowedTransitions
                  ? allowedTransitions.includes(statusOption.id) ||
                    task.status === statusOption.id
                  : true;
                // Meaning: if cached allowedTransitions exists:
                // use them as reference to enable or disable <option/>
                // also check if current tasks status is the same as option's status
                // because if they are the same, it should be enabled
                // even if it's not in allowedTransitions
                return (
                  <option
                    key={statusOption.id}
                    value={statusOption.id}
                    disabled={!isAllowed}
                    className="dark:bg-zinc-900 dark:text-white"
                  >
                    {statusOption.label} {!isAllowed && "(Locked)"}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}
    </Draggable>
  );
}
