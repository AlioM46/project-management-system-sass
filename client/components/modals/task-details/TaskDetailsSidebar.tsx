"use client";

import type { RefObject } from "react";
import { Calendar, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/features/tasks/types";
import { Member } from "@/features/team/types";
import { TaskAssigneesSection } from "./TaskAssigneesSection";

interface TaskDetailsSidebarProps {
    sidebarRef: RefObject<HTMLDivElement | null>;
    task: Task;
    members: Member[];
    assignedUserIds: string[];
    assignedUsers: Array<{ id: string; name: string; email: string }>;
    allowedTransitions: string[];
    isLoadingTransitions: boolean;
    isStatusOpen: boolean;
    isPriorityOpen: boolean;
    isAssigneesOpen: boolean;
    isUpdatingAssignees: boolean;
    assigneeSearchQuery: string;
    setIsStatusOpen: (value: boolean) => void;
    setIsPriorityOpen: (value: boolean) => void;
    setIsAssigneesOpen: (value: boolean) => void;
    setAssigneeSearchQuery: (value: string) => void;
    onOpenStatusMenu: () => void;
    onStatusChange: (status: Task["status"]) => void;
    onPriorityChange: (priority: Task["priority"]) => void;
    onToggleAssignee: (memberUserId: string) => void;
}

export function TaskDetailsSidebar({
    sidebarRef,
    task,
    members,
    assignedUserIds,
    assignedUsers,
    allowedTransitions,
    isLoadingTransitions,
    isStatusOpen,
    isPriorityOpen,
    isAssigneesOpen,
    isUpdatingAssignees,
    assigneeSearchQuery,
    setIsStatusOpen,
    setIsPriorityOpen,
    setIsAssigneesOpen,
    setAssigneeSearchQuery,
    onOpenStatusMenu,
    onStatusChange,
    onPriorityChange,
    onToggleAssignee,
}: TaskDetailsSidebarProps) {
    return (
        <div ref={sidebarRef} className="w-full space-y-8 bg-zinc-50/50 p-6 md:w-64 dark:bg-transparent">
            <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</h4>
                <div className="relative inline-block w-full">
                    <Button
                        variant="outline"
                        className={`w-full justify-start border-0 text-left font-medium shadow-sm ${
                            task.status === "DONE" ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                            task.status === "IN_PROGRESS" ? "bg-blue-500 text-white hover:bg-blue-600" :
                            task.status === "BLOCKED" ? "bg-orange-500 text-white hover:bg-orange-600" :
                            task.status === "CANCELLED" ? "bg-zinc-400 text-white hover:bg-zinc-500" :
                            "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                        onClick={(event) => {
                            event.stopPropagation();
                            const opening = !isStatusOpen;
                            setIsStatusOpen(opening);
                            setIsPriorityOpen(false);
                            setIsAssigneesOpen(false);

                            if (opening) {
                                onOpenStatusMenu();
                            }
                        }}
                    >
                        {task.status.replace("_", " ").toUpperCase()}
                    </Button>

                    {isStatusOpen && (
                        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f0f0f]">
                            <div className="flex flex-col">
                                {isLoadingTransitions ? (
                                    <div className="p-3 text-center text-sm text-zinc-500">Loading transitions...</div>
                                ) : (
                                    [
                                        { id: "TODO", label: "TO DO", color: "bg-zinc-200 dark:bg-zinc-700" },
                                        { id: "IN_PROGRESS", label: "IN PROGRESS", color: "bg-blue-500" },
                                        { id: "BLOCKED", label: "BLOCKED", color: "bg-orange-500" },
                                        { id: "DONE", label: "DONE", color: "bg-emerald-500" },
                                        { id: "CANCELLED", label: "CANCELLED", color: "bg-zinc-400" },
                                    ].map((statusOption) => {
                                        const isAllowed = allowedTransitions.includes(statusOption.id) || task.status === statusOption.id;

                                        return (
                                            <button
                                                key={statusOption.id}
                                                disabled={!isAllowed}
                                                className={`flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 ${
                                                    isAllowed
                                                        ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5"
                                                        : "cursor-not-allowed bg-zinc-50 opacity-50 dark:bg-[#0a0a0a]"
                                                }`}
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (!isAllowed) {
                                                        return;
                                                    }

                                                    onStatusChange(statusOption.id as Task["status"]);
                                                    setIsStatusOpen(false);
                                                }}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${statusOption.color}`} />
                                                {statusOption.label}
                                                {!isAllowed && task.status !== statusOption.id && <span className="ml-auto text-[10px] uppercase text-zinc-400">Locked</span>}
                                                {task.status === statusOption.id && <span className="ml-auto text-[10px] uppercase text-blue-500">Current</span>}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <TaskAssigneesSection
                members={members}
                assignedUserIds={assignedUserIds}
                assignedUsers={assignedUsers}
                isOpen={isAssigneesOpen}
                isUpdating={isUpdatingAssignees}
                searchQuery={assigneeSearchQuery}
                setIsOpen={setIsAssigneesOpen}
                setSearchQuery={setAssigneeSearchQuery}
                onToggleAssignee={onToggleAssignee}
            />

            <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</h4>
                <div className="relative inline-block w-full">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-left hover:bg-zinc-100 dark:hover:bg-white/5"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsPriorityOpen(!isPriorityOpen);
                            setIsStatusOpen(false);
                            setIsAssigneesOpen(false);
                        }}
                    >
                        <Flag
                            className={`mr-2 h-4 w-4 ${
                                task.priority === "high" ? "fill-red-500 text-red-500" :
                                task.priority === "medium" ? "fill-amber-500 text-amber-500" :
                                "fill-blue-500 text-blue-500"
                            }`}
                        />
                        <span className="capitalize">{task.priority} Priority</span>
                    </Button>

                    {isPriorityOpen && (
                        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f0f0f]">
                            <div className="flex flex-col">
                                {[
                                    { id: "high", label: "Urgent", color: "fill-red-500 text-red-500" },
                                    { id: "medium", label: "High", color: "fill-amber-500 text-amber-500" },
                                    { id: "low", label: "Normal", color: "fill-blue-500 text-blue-500" },
                                ].map((priorityOption) => (
                                    <button
                                        key={priorityOption.id}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onPriorityChange(priorityOption.id as Task["priority"]);
                                            setIsPriorityOpen(false);
                                        }}
                                    >
                                        <Flag className={`h-4 w-4 ${priorityOption.color}`} />
                                        {priorityOption.label}
                                    </button>
                                ))}
                                <button
                                    className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-white/5"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsPriorityOpen(false);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Dates</h4>
                <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-zinc-400 dark:hover:bg-white/5">
                    <Calendar className="h-4 w-4" />
                    <span>No due date</span>
                </div>
            </div>
        </div>
    );
}
