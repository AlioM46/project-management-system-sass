<?php

namespace App\Modules\Workspace\Actions;

use App\Modules\Audit\Model\AuditLog;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Enums\TaskStatus;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Model\WorkspaceMember;
use App\Modules\Workspace\Services\WorkspaceContextService;
use PHPUnit\Framework\Constraint\Count;

class GetDashboardSummary
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function execute(): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();
        $workspaceId = $workspace->id;

        $projectCount = Project::query()->where('workspace_id', $workspaceId)->count();

        $taskStats = Task::query()
            ->where('workspace_id', $workspaceId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        $memberCount = Workspace_Members::query()->where('workspace_id', $workspaceId)->count();

        $recentActivity = AuditLog::query()
            ->where('workspace_id', $workspaceId)
            ->with('actor')
            ->latest('occurred_at')
            ->take(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'event_type' => $log->event_type,
                    'actor_name' => $log->actor->name ?? 'System',
                    'occurred_at' => $log->occurred_at,
                    'target_type' => $log->target_type,
                    'metadata' => $log->metadata,
                ];
            });

        $activeTasksCount = Task::query()
            ->where('workspace_id', $workspaceId)
            ->whereNotIn('status', [TaskStatus::CANCELLED->value, TaskStatus::DONE->value])
            ->count();

        $last7Days = collect(range(0, 6))->map(fn($i) => now()->subDays($i)->format('Y-m-d'))->reverse();
        
        $completionsByDay = Task::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', TaskStatus::DONE->value)
            ->where('updated_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(updated_at) as date, count(*) as count')
            ->groupBy('date')
            ->get()
            ->pluck('count', 'date');

        $chartData = $last7Days->map(fn($date) => [
            'date' => date('D', strtotime($date)),
            'completed' => $completionsByDay[$date] ?? 0
        ])->values();

        return [
            'stats' => [
                'total_projects' => $projectCount,
                'active_tasks' => $activeTasksCount,
                'completed_tasks' => $taskStats[TaskStatus::DONE->value] ?? 0,
                'total_members' => $memberCount,
            ],
            'recent_activity' => $recentActivity,
            'task_distribution' => $taskStats,
            'completions_chart' => $chartData,
        ];
    }
}
