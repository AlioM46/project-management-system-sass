"use client";

/**
 * # LeadsPipelinePage Component
 * 
 * The main CRM Leads Pipeline page controller.
 * It coordinates loading stats from backend API endpoints and manages:
 * 1. Filter states (by Course, Staff, Sort order)
 * 2. Drag & Drop movements (including state transitions lookup checks)
 * 3. Modal details selector triggers
 * 
 * The page view layout is fully split into sub-components for better maintainability.
 */

import { useState, useEffect, useCallback } from "react";
import { Circle, CheckCircle2, Clock } from "lucide-react";
import { getTasks, updateTask, createTask, getTaskTransitions } from "@/features/tasks/api/tasks.api";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { getCourses } from "@/features/projects/api/projects.api";
import { Task } from "@/features/tasks/types";
import { Course } from "@/features/projects/types";
import { toast } from "sonner";
import { TaskDetailsModal } from "@/components/modals/TaskDetailsModal";
import { DropResult } from '@hello-pangea/dnd';
import { useTranslation } from "@/lib/context/LanguageContext";

// Import split pipeline components
import PipelineHeader from "@/components/dashboard/pipeline/PipelineHeader";
import PipelineFilters from "@/components/dashboard/pipeline/PipelineFilters";
import PipelineSortBar from "@/components/dashboard/pipeline/PipelineSortBar";
import PipelineBoard from "@/components/dashboard/pipeline/PipelineBoard";

interface PipelineColumn {
    id: string;          // normalized stage name used as status key
    label: string;       // display label
    stageId?: string;    // actual backend stage_id for creation
    isSuccess?: boolean;
    color: string;
}

// Fallback columns if no leads exist to derive stages from
const FALLBACK_COLUMNS: PipelineColumn[] = [
    { id: 'NEW_INQUIRY', label: 'New Inquiry', color: 'text-zinc-500' },
    { id: 'CONTACTED', label: 'Contacted', color: 'text-sky-500' },
    { id: 'QUALIFIED', label: 'Qualified', color: 'text-blue-500' },
    { id: 'TEST_DRIVE_SESSION', label: 'Test Drive', color: 'text-amber-500' },
    { id: 'DEPOSIT_PAID', label: 'Deposit Paid', color: 'text-indigo-500' },
    { id: 'WON', label: 'Won', color: 'text-emerald-500', isSuccess: true },
    { id: 'LOST', label: 'Lost', color: 'text-rose-500' },
];

const STAGE_COLORS = [
    'text-zinc-500',
    'text-blue-500',
    'text-amber-500',
    'text-emerald-500',
    'text-purple-500',
    'text-rose-500',
];

function getStageIcon(index: number, isSuccess?: boolean) {
    if (isSuccess) return CheckCircle2;
    if (index === 0) return Circle;
    return Clock;
}

function normalizeStatus(name: string): string {
    return name.trim().replace(/\s+/g, '_').toUpperCase();
}

export default function LeadsPipelinePage() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState<Task[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [columns, setColumns] = useState<PipelineColumn[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        project_id: "",
        assignee_id: "",
        sort_by: "created_at",
        sort_dir: "desc"
    });
    const [selectedLeadId, setSelectedLeadId] = useState<string | number | null>(null);
    
    const selectedLead = leads.find(l => l.id == selectedLeadId) || null;
    const [isMounted, setIsMounted] = useState(false);
    
    // Inline Creation State
    const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
    const [newLeadTitle, setNewLeadTitle] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("");

    // Transitions State (Cache per lead ID)
    const [leadTransitions, setLeadTransitions] = useState<Record<string, string[]>>({});

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchTransitions = async (leadId: string | number) => {
        const idStr = String(leadId);
        if (leadTransitions[idStr]) return;
        try {
            const res = await getTaskTransitions(idStr);
            setLeadTransitions(prev => ({ ...prev, [idStr]: res.allowed_transitions }));
        } catch (error) {
            console.error("Failed to load transitions for lead", idStr);
        }
    };

    // Build dynamic columns from the first lead's transitions, or from leads themselves
    const buildColumnsFromStages = useCallback(async (fetchedLeads: Task[]) => {
        if (fetchedLeads.length > 0) {
            try {
                const res = await getTaskTransitions(String(fetchedLeads[0].id));
                if (res.stages && res.stages.length > 0) {
                    const dynamicCols: PipelineColumn[] = res.stages
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((stage, index) => ({
                            id: normalizeStatus(stage.name),
                            label: stage.name,
                            stageId: String(stage.stage_id),
                            isSuccess: stage.is_success,
                            color: STAGE_COLORS[index % STAGE_COLORS.length],
                        }));
                    setColumns(dynamicCols);
                    return;
                }
            } catch {
                // Fall through to fallback
            }
        }

        const statusSet = new Set(fetchedLeads.map(l => l.status));
        if (statusSet.size > 0) {
            const derivedCols: PipelineColumn[] = Array.from(statusSet).map((status, index) => ({
                id: status,
                label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                color: STAGE_COLORS[index % STAGE_COLORS.length],
            }));
            setColumns(derivedCols);
            return;
        }

        setColumns(FALLBACK_COLUMNS);
    }, []);

    const fetchLeads = useCallback(async () => {
        setIsLoading(true);
        try {
            const [leadsRes, coursesRes, membersRes] = await Promise.all([
                getTasks(filters),
                getCourses(),
                getMembers()
            ]);
            const fetchedLeads = leadsRes.tasks || (Array.isArray(leadsRes) ? leadsRes : []);
            setLeads(fetchedLeads);
            
            const fetchedCourses = coursesRes.courses || (Array.isArray(coursesRes) ? coursesRes : []);
            setCourses(fetchedCourses);
            if (fetchedCourses.length > 0 && !selectedCourseId) {
                setSelectedCourseId(fetchedCourses[0].id);
            }

            setMembers(membersRes.members || []);
            await buildColumnsFromStages(fetchedLeads);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load pipeline data.");
        } finally {
            setIsLoading(false);
        }
    }, [filters, buildColumnsFromStages, selectedCourseId]);

    useEffect(() => {
        fetchLeads();
    }, [filters]);

    const moveLead = async (leadId: string | number, newStatus: Task['status']) => {
        const lead = leads.find(l => l.id == leadId);
        if (!lead || lead.status === newStatus) return;

        let lost_reason: string | null = null;
        if (newStatus === "LOST") {
            const reason = window.prompt(t("modal_lead_details_lost_prompt"));
            if (reason === null) return;
            lost_reason = reason.trim() || "No reason specified";
        }

        setLeads(prev => prev.map(l => l.id == leadId ? { ...l, status: newStatus, lost_reason } : l));
        
        try {
            await updateTask(String(leadId), { status: newStatus, lost_reason });
            toast.success(t("pipeline_toast_moved"));
            
            setLeadTransitions(prev => {
                const next = { ...prev };
                delete next[String(leadId)];
                return next;
            });
            fetchTransitions(leadId);
        } catch (error) {
            console.error("Failed to update lead:", error);
            toast.error(t("modal_lead_details_update_error"));
            fetchLeads();
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const newStatus = destination.droppableId as Task['status'];
        const lead = leads.find(l => String(l.id) === draggableId);
        
        const allowed = leadTransitions[draggableId] || [];
        const isAllowed = lead?.status === newStatus || allowed.includes(newStatus);
        
        if (isAllowed) {
            moveLead(draggableId, newStatus);
        } else {
            toast.error(t("pipeline_toast_error_move"));
        }
    };

    const handleInlineCreate = async (e: React.FormEvent, _status: Task['status']) => {
        e.preventDefault();
        if (!newLeadTitle.trim() || !selectedCourseId) {
            if (!selectedCourseId) toast.error("Please select a course first.");
            return;
        }

        try {
            await createTask({
                title: newLeadTitle,
                project_id: selectedCourseId,
                priority: 'medium'
            });
            toast.success(t("modal_lead_created_success"));
            setNewLeadTitle("");
            setCreatingInColumn(null);
            fetchLeads();
        } catch (error) {
            console.error("Failed to create lead:", error);
            toast.error(t("modal_lead_created_error"));
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-8 pt-6 text-start">
            <PipelineHeader 
                title={t("pipeline_title")}
                subtitle={t("pipeline_subtitle")}
                newLeadLabel={t("pipeline_new_lead")}
                onNewLeadClick={() => {
                    if (courses.length === 0) {
                        toast.error(t("modal_lead_created_error"));
                        return;
                    }
                    setCreatingInColumn(columns[0]?.id || 'NEW_INQUIRY');
                }}
            />

            <PipelineFilters 
                filters={filters}
                onChange={setFilters}
                courses={courses}
                members={members}
                t={t}
            />

            <PipelineSortBar 
                sortBy={filters.sort_by}
                sortDir={filters.sort_dir}
                onChange={setFilters}
            />

            <PipelineBoard 
                isLoading={isLoading}
                leads={leads}
                columns={columns}
                courses={courses}
                getStageIcon={getStageIcon}
                creatingInColumn={creatingInColumn}
                setCreatingInColumn={setCreatingInColumn}
                newLeadTitle={newLeadTitle}
                setNewLeadTitle={setNewLeadTitle}
                selectedCourseId={selectedCourseId}
                setSelectedCourseId={setSelectedCourseId}
                leadTransitions={leadTransitions}
                onSelectLead={setSelectedLeadId}
                onMoveLead={moveLead}
                onFetchTransitions={fetchTransitions}
                onInlineCreate={handleInlineCreate}
                onDragEnd={handleDragEnd}
                t={t}
            />
            
            <TaskDetailsModal 
                isOpen={!!selectedLeadId}
                task={selectedLead}
                onClose={() => setSelectedLeadId(null)}
                onUpdate={fetchLeads}
            />
        </div>
    );
}
