"use client";

import type { FormEvent } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/types";
import type { Task } from "@/features/tasks/types";
import { InlineTaskCreateCard } from "./InlineTaskCreateCard";
import { TaskCard } from "./TaskCard";

const BOARD_COLUMNS: Array<{
  id: Task["status"];
  label: string;
  icon: typeof Circle;
  color: string;
}> = [
  { id: "TODO", label: "To Do", icon: Circle, color: "text-zinc-500" },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    id: "BLOCKED",
    label: "Blocked",
    icon: AlertCircle,
    color: "text-orange-500",
  },
  { id: "DONE", label: "Done", icon: CheckCircle2, color: "text-emerald-500" },
  {
    id: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    color: "text-zinc-400",
  },
];

interface TasksBoardProps {
  tasks: Task[];
  creatingInColumn: string | null;
  newTaskTitle: string;
  selectedProjectId: string;
  projects: Project[];
  allowedStatusByTaskId: Record<string, string[]>;
  onDragEnd: (result: DropResult) => void;
  onStartCreate: (status: Task["status"]) => void;
  onTitleChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onSubmitInlineCreate: (
    event: FormEvent<HTMLFormElement>,
    status: Task["status"],
  ) => void;
  onCancelInlineCreate: () => void;
  onOpenTask: (taskId: string) => void;
  onLoadAllowedStatuses: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}

export function TasksBoard({
  tasks,
  creatingInColumn,
  newTaskTitle,
  selectedProjectId,
  projects,
  allowedStatusByTaskId,
  onDragEnd,
  onStartCreate,
  onTitleChange,
  onProjectChange,
  onSubmitInlineCreate,
  onCancelInlineCreate,
  onOpenTask,
  onLoadAllowedStatuses,
  onStatusChange,
}: TasksBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((column) => {
          const Icon = column.icon;
          const tasksInColumn = tasks.filter(
            (task) => task.status === column.id,
          );

          return (
            <Droppable
              key={column.id}
              droppableId={column.id}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex h-full w-[350px] shrink-0 flex-col rounded-3xl border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm transition-colors dark:border-white/10 dark:bg-[#0a0a0a]/50 ${
                    snapshot.isDraggingOver
                      ? "border-blue-500/50 bg-zinc-100/50 dark:bg-[#1a1a1a]/50"
                      : ""
                  }`}
                >
                  <div className="mb-4 flex shrink-0 items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${column.color}`} />
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {column.label}
                      </h3>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                        {tasksInColumn.length}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10"
                      onClick={() => onStartCreate(column.id)}
                    >
                      <Plus className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pb-4 pr-2">
                    {tasksInColumn.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-white/10">
                        Drop tasks here
                      </div>
                    )}

                    {tasksInColumn.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        // 5 - 0 = 5
                        // 5 - 1 = 4
                        // 5 - 2 = 3
                        // ...

                        index={index} // reverse order for better UX
                        allowedTransitions={
                          allowedStatusByTaskId[String(task.id)]
                        }
                        onOpen={onOpenTask}
                        onLoadAllowedStatuses={onLoadAllowedStatuses}
                        onStatusChange={onStatusChange}
                      />
                    ))}
                    {provided.placeholder}

                    {creatingInColumn === column.id && (
                      <InlineTaskCreateCard
                        status={column.id}
                        title={newTaskTitle}
                        selectedProjectId={selectedProjectId}
                        projects={projects}
                        onTitleChange={onTitleChange}
                        onProjectChange={onProjectChange}
                        onSubmit={onSubmitInlineCreate}
                        onCancel={onCancelInlineCreate}
                      />
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
