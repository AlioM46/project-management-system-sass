/**
 * # PipelineColumn Component
 * 
 * This component represents a single stage column on the CRM board.
 * It is wrapped in hello-pangea/dnd's Droppable and handles:
 * 1. Rendering column headers (title, icon, lead counter, and inline create button)
 * 2. Mapping and rendering Draggable Lead cards within the column
 * 3. Displaying empty state prompt when no leads exist in this stage
 * 4. Displaying the InlineCreateForm inside the column
 */

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Droppable } from "@hello-pangea/dnd";
import { Task } from "@/features/tasks/types";
import { Course } from "@/features/projects/types";
import PipelineCard from "./PipelineCard";
import InlineCreateForm from "./InlineCreateForm";

interface PipelineColumnProps {
    col: {
        id: string;
        label: string;
        stageId?: string;
        isSuccess?: boolean;
        color: string;
    };
    colIndex: number;
    colLeads: Task[];
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
    t: (key: any) => string;
    allColumns: any[];
}

export default function PipelineColumn({
    col,
    colIndex,
    colLeads,
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
    t,
    allColumns,
}: PipelineColumnProps) {
    const Icon = getStageIcon(colIndex, col.isSuccess);

    return (
        <Droppable key={col.id} droppableId={col.id}>
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col bg-zinc-50/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-white/10 rounded-3xl p-4 h-full w-[350px] shrink-0 shadow-sm transition-colors ${
                        snapshot.isDraggingOver ? 'bg-zinc-100/50 dark:bg-[#1a1a1a]/50 border-blue-500/50' : ''
                    }`}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${col.color}`} />
                            <h3 className="font-semibold text-zinc-900 dark:text-white">{col.label}</h3>
                            {col.isSuccess && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold uppercase">
                                    Success
                                </span>
                            )}
                            <span className="bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 text-xs py-0.5 px-2 rounded-full font-medium">
                                {colLeads.length}
                            </span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10" 
                            onClick={() => setCreatingInColumn(col.id)}
                        >
                            <Plus className="h-4 w-4 text-zinc-500" />
                        </Button>
                    </div>

                    {/* Column Body / Leads list */}
                    <div className="flex-1 overflow-y-auto pe-2 space-y-3 pb-4">
                        {colLeads.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-24 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
                                {t("pipeline_drag_instruction")}
                            </div>
                        )}
                        
                        {colLeads.map((lead, index) => (
                            <PipelineCard 
                                key={lead.id}
                                lead={lead}
                                index={index}
                                columns={allColumns}
                                leadTransitions={leadTransitions}
                                onSelect={onSelectLead}
                                onMove={onMoveLead}
                                onFetchTransitions={onFetchTransitions}
                            />
                        ))}
                        {provided.placeholder}

                        {/* Inline Create Input */}
                        {creatingInColumn === col.id && (
                            <InlineCreateForm 
                                courseId={selectedCourseId}
                                courses={courses}
                                leadTitle={newLeadTitle}
                                onTitleChange={setNewLeadTitle}
                                onCourseChange={setSelectedCourseId}
                                onCancel={() => setCreatingInColumn(null)}
                                onSubmit={(e) => onInlineCreate(e, col.id)}
                            />
                        )}
                    </div>
                </div>
            )}
        </Droppable>
    );
}
