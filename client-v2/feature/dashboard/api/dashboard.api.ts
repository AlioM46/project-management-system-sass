import { apiClient } from "@/shared/api/apiClient";

export interface DashboardSummary {
  stats: {
    total_projects: number;
    total_tasks: number;
    active_tasks: number;
    completed_tasks: number;
    total_members: number;
  };
  summary: {
    completion_rate: number;
    completion_delta: number;
    tasks_created_7d: number;
    tasks_completed_7d: number;
    activity_count_7d: number;
  };
  recent_activity: Array<{
    id: number;
    event_type: string;
    event_label: string;
    actor_name: string;
    occurred_at: string;
    target_type: string;
    target_label: string;
    target_id: number | null;
    metadata: Record<string, unknown> | null;
    summary: string;
  }>;
  task_distribution: Record<string, number>;
  completions_chart: Array<{
    date: string;
    label: string;
    completed: number;
    created: number;
    activity: number;
  }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiClient.get<DashboardSummary>("/workspaces/dashboard/summary");
}
