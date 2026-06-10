import { apiClient } from "@/shared/api/apiClient";

export interface DashboardSummary {
    stats: {
        total_courses: number;
        total_leads: number;
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
    lead_distribution: Record<string, number>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return await apiClient.get<DashboardSummary>("/workspaces/dashboard/summary");
}
