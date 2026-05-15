import { apiClient } from "@/shared/api/apiClient";

export interface DashboardSummary {
    stats: {
        total_projects: number;
        active_tasks: number;
        completed_tasks: number;
        total_members: number;
    };
    recent_activity: Array<{
        id: number;
        event_type: string;
        actor_name: string;
        occurred_at: string;
        target_type: string;
        metadata: any;
    }>;
    task_distribution: Record<string, number>;
    completions_chart: Array<{
        date: string;
        completed: number;
    }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return await apiClient.get<DashboardSummary>("/workspaces/dashboard/summary");
}
