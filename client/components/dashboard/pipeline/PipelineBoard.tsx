/**
 * # PipelineBoard Component
 * 
 * This component serves as the central Kanban Board for leads.
 * It is responsible for:
 * 1. Rendering loading skeletons during data fetches
 * 2. Displaying empty states if no stages exist
 * 3. Handling the hello-pangea/dnd's DragDropContext wrapping
 * 4. Mapping all active columns to PipelineColumn components
 */

import React from "react";
import { Circle } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Task } from "@/features/tasks/types";
import { Course } from "@/features/projects/types";
import PipelineColumn from "./PipelineColumn";

interface PipelineColumnData {
    id: string;
    label: string;
    stageId?: string;
    isSuccess?: boolean;
    color: string;
}

interface PipelineBoardProps {
    isLoading: boolean;
    leads: Task[];
    columns: PipelineColumnData[];
    courses: Course[];
    getStageIcon: (index: number, isSuccess?: boolean) => React.ComponentType<any>;
    creatingInColumn: string | null;
    setCreatingInColumn: (val: string | null) => void;
    newLeadTitle: string;
    setNewLeadTitle: (val: string) => void;
    selectedCourseId: string;
    setSelectedCourseId: (val: string) => void;
    leadTransitions: Record<string, string[]>;
    onSelectLead: (id: string | number) => void;
    onMoveLead: (id: string | number, newStatus: any) => void;
    onFetchTransitions: (id: string | number) => void;
    onInlineCreate: (e: React.FormEvent, status: any) => void;
    onDragEnd: (result: DropResult) => void;
    t: (key: any) => string;
}

export default function PipelineBoard({
    isLoading,
    leads,
    columns,
    courses,
    getStageIcon,
    creatingInColumn,
    setCreatingInColumn,
    newLeadTitle,
    setNewLeadTitle,
    selectedCourseId,
    setSelectedCourseId,
    leadTransitions,
    onSelectLead,
    onMoveLead,
    onFetchTransitions,
    onInlineCreate,
    onDragEnd,
    t,
}: PipelineBoardProps) {
    if (isLoading && leads.length === 0) {
        return (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-zinc-100 dark:bg-white/5 rounded-2xl h-full" />
                ))}
            </div>
        );
    }

    if (columns.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Circle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("pipeline_no_stages")}</h3>
                    <p className="text-zinc-500 mt-2 max-w-md">{t("pipeline_no_stages_desc")}</p>
                </div>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 flex overflow-x-auto gap-6 pb-4">
                {columns.map((col, colIndex) => {
                    const colLeads = leads.filter(l => l.status === col.id);
                    
                    return (
                        <PipelineColumn 
                            key={col.id}
                            col={col}
                            colIndex={colIndex}
                            colLeads={colLeads}
                            courses={courses}
                            getStageIcon={getStageIcon}
                            creatingInColumn={creatingInColumn}
                            setCreatingInColumn={setCreatingInColumn}
                            newLeadTitle={newLeadTitle}
                            setNewLeadTitle={setNewLeadTitle}
                            selectedCourseId={selectedCourseId}
                            setSelectedCourseId={setSelectedCourseId}
                            leadTransitions={leadTransitions}
                            onSelectLead={onSelectLead}
                            onMoveLead={onMoveLead}
                            onFetchTransitions={onFetchTransitions}
                            onInlineCreate={onInlineCreate}
                            t={t}
                            allColumns={columns}
                        />
                    );
                })}
            </div>
        </DragDropContext>
    );
}
