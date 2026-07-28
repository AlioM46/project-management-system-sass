/**
 * # PipelineCard Component
 * 
 * This component represents an individual lead card within the pipeline columns.
 * It is wrapped in hello-pangea/dnd's Draggable and includes:
 * 1. Visual indicator borders depending on lead source (WhatsApp, Website, Referral, etc.)
 * 2. Converted student badge (showing student codes)
 * 3. Assignees list
 * 4. Dropdown selector to change stages manually
 */

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/features/tasks/types";

interface PipelineCardProps {
    lead: Task;
    index: number;
    columns: Array<{ id: string; label: string }>;
    leadTransitions: Record<string, string[]>;
    onSelect: (id: string | number) => void;
    onMove: (id: string | number, newStatus: any) => void;
    onFetchTransitions: (id: string | number) => void;
}

export default function PipelineCard({
    lead,
    index,
    columns,
    leadTransitions,
    onSelect,
    onMove,
    onFetchTransitions,
}: PipelineCardProps) {
    return (
        <Draggable draggableId={String(lead.id)} index={index}>
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{...provided.draggableProps.style}}
                    onMouseEnter={() => onFetchTransitions(lead.id)}
                    onClick={() => onSelect(lead.id)}
                    className={`bg-white dark:bg-[#0f0f0f] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden text-start ${
                        snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 scale-[1.02] opacity-90 rotate-1 z-50' : ''
                    }`}
                >
                    {/* Left border indicator based on source */}
                    <div className={`absolute start-0 top-0 bottom-0 w-1 ${
                        lead.student ? 'bg-emerald-500' :
                        lead.source === 'whatsapp' ? 'bg-green-500' :
                        lead.source === 'website' ? 'bg-blue-500' :
                        lead.source === 'referral' ? 'bg-purple-500' : 'bg-zinc-300'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-2 ps-2">
                        <h4 className="font-medium text-zinc-900 dark:text-white line-clamp-2">
                            {lead.title}
                        </h4>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity -me-2 -mt-1 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(lead.id);
                            }}
                        >
                            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                        </Button>
                    </div>
                    
                    {lead.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 ps-2">
                            {lead.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between ps-2 mt-4">
                        {/* Assignees */}
                        <div className="flex -space-x-2">
                            {lead.assignees?.slice(0, 3).map(a => (
                                <div 
                                    key={a.id} 
                                    className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-[#0f0f0f]" 
                                    title={a.name}
                                >
                                    {a.name.substring(0, 2).toUpperCase()}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Student badge */}
                            {lead.student && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold">
                                    🎓 {lead.student.student_code}
                                </span>
                            )}

                            {/* Source badge */}
                            {lead.source && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400 capitalize">
                                    {lead.source}
                                </span>
                            )}

                            {/* Stage Dropdown */}
                            <select
                                value={lead.status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFetchTransitions(lead.id);
                                }}
                                onMouseEnter={() => onFetchTransitions(lead.id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onMove(lead.id, e.target.value);
                                }}
                                className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-md py-1 px-2 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {columns.map(c => {
                                    const allowed = leadTransitions[String(lead.id)];
                                    const isAllowed = allowed ? (allowed.includes(c.id) || lead.status === c.id) : true;
                                    return (
                                        <option key={c.id} value={c.id} disabled={!isAllowed} className="dark:bg-zinc-900 dark:text-white">
                                            {c.label} {!isAllowed && '(Locked)'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
