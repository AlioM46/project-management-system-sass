"use client";

import type { RefObject } from "react";
import { Calendar, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/features/tasks/types";
import { Member } from "@/features/team/types";
import { TaskAssigneesSection } from "./TaskAssigneesSection";
import { useTranslation } from "@/lib/context/LanguageContext";

interface TaskDetailsSidebarProps {
    sidebarRef: RefObject<HTMLDivElement | null>;
    task: Task;
    members: Member[];
    assignedUserIds: string[];
    assignedUsers: Array<{ id: string; name: string; email: string }>;
    allowedTransitions: string[];
    stages: Array<{ stage_id: string | number, name: string, is_success?: boolean }>;
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
    stages,
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
    const { t } = useTranslation();
    const currentStageName = task.stage?.name || task.status.replace("_", " ");

    const getTranslatedStageName = (name: string) => {
        const lower = name.toLowerCase();
        if (lower === "new inquiry") return t("lead_stage_new_inquiry");
        if (lower === "qualified") return t("lead_stage_qualified");
        if (lower === "test drive session") return t("lead_stage_test_drive");
        if (lower === "won") return t("lead_stage_won");
        if (lower === "lost") return t("lead_stage_lost");
        return name;
    };

    const getTranslatedPriorityName = (priority: string) => {
        const lower = priority.toLowerCase();
        if (lower === "high") return t("priority_urgent");
        if (lower === "medium") return t("priority_high");
        if (lower === "low") return t("priority_normal");
        return priority;
    };

    const stagesList = stages.length > 0 ? stages : [
        { stage_id: "NEW_INQUIRY", name: "New Inquiry" },
        { stage_id: "QUALIFIED", name: "Qualified" },
        { stage_id: "TEST_DRIVE_SESSION", name: "Test Drive Session" },
        { stage_id: "WON", name: "Won", is_success: true },
        { stage_id: "LOST", name: "Lost" }
    ];

    return (
        <div ref={sidebarRef} className="w-full space-y-8 bg-zinc-50/50 p-6 md:w-64 dark:bg-transparent text-start">
            <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("modal_lead_details_status")}</h4>
                <div className="relative inline-block w-full text-start">
                    <Button
                        variant="outline"
                        className={`w-full justify-start border-0 font-medium shadow-sm text-start`}
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
                        {getTranslatedStageName(currentStageName).toUpperCase()}
                    </Button>

                    {isStatusOpen && (
                        <div className="absolute start-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f0f0f] text-start">
                            <div className="flex flex-col">
                                {isLoadingTransitions ? (
                                    <div className="p-3 text-center text-sm text-zinc-500">{t("status_loading")}</div>
                                ) : (
                                    stagesList.map((stageOption) => {
                                        const statusId = stageOption.name.trim().replace(/\s+/g, '_').toUpperCase();
                                        const isAllowed = allowedTransitions.includes(statusId) || task.status === statusId;
                                        const color = stageOption.is_success ? "bg-emerald-500" : (statusId === "LOST" ? "bg-red-500" : "bg-blue-500");

                                        return (
                                            <button
                                                key={stageOption.stage_id}
                                                disabled={!isAllowed}
                                                className={`flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 text-start w-full ${
                                                    isAllowed
                                                        ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5"
                                                        : "cursor-not-allowed bg-zinc-50 opacity-50 dark:bg-[#0a0a0a]"
                                                }`}
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (!isAllowed) {
                                                        return;
                                                    }

                                                    onStatusChange(statusId as Task["status"]);
                                                    setIsStatusOpen(false);
                                                }}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${color} shrink-0`} />
                                                <span className="truncate">{getTranslatedStageName(stageOption.name).toUpperCase()}</span>
                                                {!isAllowed && task.status !== statusId && <span className="ms-auto text-[10px] uppercase text-zinc-400">{t("status_locked")}</span>}
                                                {task.status === statusId && <span className="ms-auto text-[10px] uppercase text-blue-500">{t("status_current")}</span>}
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
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("modal_lead_details_priority")}</h4>
                <div className="relative inline-block w-full text-start">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-start hover:bg-zinc-100 dark:hover:bg-white/5"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsPriorityOpen(!isPriorityOpen);
                            setIsStatusOpen(false);
                            setIsAssigneesOpen(false);
                        }}
                    >
                        <Flag
                            className={`me-2 h-4 w-4 ${
                                task.priority === "high" ? "fill-red-500 text-red-500" :
                                task.priority === "medium" ? "fill-amber-500 text-amber-500" :
                                "fill-blue-500 text-blue-500"
                            }`}
                        />
                        <span className="capitalize">{t("priority_label").replace("{priority}", getTranslatedPriorityName(task.priority))}</span>
                    </Button>

                    {isPriorityOpen && (
                        <div className="absolute start-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f0f0f] text-start">
                            <div className="flex flex-col text-start">
                                {[
                                    { id: "high", label: t("priority_urgent"), color: "fill-red-500 text-red-500" },
                                    { id: "medium", label: t("priority_high"), color: "fill-amber-500 text-amber-500" },
                                    { id: "low", label: t("priority_normal"), color: "fill-blue-500 text-blue-500" },
                                ].map((priorityOption) => (
                                    <button
                                        key={priorityOption.id}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 text-start w-full"
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
                                    className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-white/5 text-start w-full"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setIsPriorityOpen(false);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                    {t("priority_clear")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("modal_lead_details_dates")}</h4>
                <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-zinc-400 dark:hover:bg-white/5">
                    <Calendar className="h-4 w-4" />
                    <span>{t("modal_lead_details_no_date")}</span>
                </div>
            </div>
        </div>
    );
}
