import { apiClient } from "@/shared/api/apiClient";
import { CreateLeadInput, CreateTaskInput, Lead, Task, UpdateLeadInput, UpdateTaskInput } from "../types";

function normalizeStageStatus(name?: string | null): string {
    return (name || "NEW_LEAD")
        .trim()
        .replace(/\s+/g, "_")
        .toUpperCase();
}

function mapLead(lead: any): Lead {
    return {
        ...lead,
        course_id: lead.course_id != null ? String(lead.course_id) : undefined,
        stage_id: lead.stage_id != null ? String(lead.stage_id) : undefined,
        project_id: lead.course_id != null ? String(lead.course_id) : undefined,
        status: normalizeStageStatus(lead.stage?.name),
        priority: "medium",
    };
}

async function resolveStageIdFromStatus(leadId: string, status?: string): Promise<string | undefined> {
    if (!status) {
        return undefined;
    }

    const response = await getTaskTransitions(leadId);
    const stage = response.stages.find((transition) => normalizeStageStatus(transition.name) === status);

    return stage ? String(stage.stage_id) : undefined;
}

export async function getTasks(filters?: { 
    project_id?: string | number, 
    status?: string, 
    assignee_id?: string | number,
    sort_by?: string,
    sort_dir?: string
}): Promise<{ tasks: Task[] }> {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value));
        });
    }
    const filterEntries = new URLSearchParams();

    if (filters?.project_id) filterEntries.append("course_id", String(filters.project_id));
    if (filters?.assignee_id) filterEntries.append("assignee_id", String(filters.assignee_id));
    if (filters?.sort_by) filterEntries.append("sort_by", String(filters.sort_by));
    if (filters?.sort_dir) filterEntries.append("sort_dir", String(filters.sort_dir));

    const url = filterEntries.toString() ? `/leads?${filterEntries.toString()}` : "/leads";
    const response = await apiClient.get<{ leads: Lead[] }>(url);
    const leads = (response.leads || []).map(mapLead);

    return {
        tasks: filters?.status ? leads.filter((lead) => lead.status === filters.status) : leads,
    };
}

export async function getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<{ lead: Lead }>(`/leads/${taskId}`);
    return mapLead(response.lead || response);
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
    const payload: CreateLeadInput = {
        title: data.title,
        description: data.description,
        course_id: data.project_id,
    };

    const response = await apiClient.post<{ lead: Lead }>("/leads", payload);
    return mapLead(response.lead || response);
}

export async function updateTask(taskId: string, data: UpdateTaskInput): Promise<Task> {
    const payload: UpdateLeadInput = {
        title: data.title,
        description: data.description,
        course_id: data.project_id ?? undefined,
        lost_reason: data.lost_reason,
        phone: data.phone,
        source: data.source ?? undefined,
    };

    if (data.status) {
        payload.stage_id = await resolveStageIdFromStatus(taskId, data.status);
    }

    const response = await apiClient.patch<{ lead: Lead }>(`/leads/${taskId}`, payload);
    return mapLead(response.lead || response);
}

export async function deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/leads/${taskId}`);
}

export async function replaceTaskAssignees(taskId: string, userIds: string[]): Promise<Task> {
    const response = await apiClient.put<{ lead: Lead }>(`/leads/${taskId}/assignees`, { user_ids: userIds });
    return mapLead(response.lead || response);
}

export async function getTaskTransitions(taskId: string): Promise<{ current_status: string, allowed_transitions: string[], stages: Array<{ stage_id: string | number, name: string, position?: number, is_success?: boolean, is_current?: boolean }> }> {
    const response = await apiClient.get<{ current_stage_id: string | number, allowed_transitions: Array<{ stage_id: string | number, name: string, position?: number, is_success?: boolean, is_current?: boolean }> }>(`/leads/${taskId}/allowed-transitions`);
    const current = response.allowed_transitions.find((transition) => transition.is_current);

    return {
        current_status: normalizeStageStatus(current?.name),
        allowed_transitions: (response.allowed_transitions || []).map((transition) => normalizeStageStatus(transition.name)),
        stages: response.allowed_transitions || [],
    };
}
