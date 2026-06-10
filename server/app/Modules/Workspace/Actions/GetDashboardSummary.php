<?php

namespace App\Modules\Workspace\Actions;

use App\Modules\Audit\Model\AuditLog;
use App\Modules\Courses\Model\Course;
use App\Modules\Leads\Model\Lead;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Services\WorkspaceContextService;

class GetDashboardSummary
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {}

    public function execute(): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();
        $workspaceId = $workspace->id;

        $courseCount = Course::query()->where('workspace_id', $workspaceId)->count();
        $leadStats = Lead::query()
            ->where('workspace_id', $workspaceId)
            ->selectRaw('stage_id, count(*) as count')
            ->groupBy('stage_id')
            ->get()
            ->pluck('count', 'stage_id')
            ->toArray();

        $memberCount = Workspace_Members::query()->where('workspace_id', $workspaceId)->count();
        $recentActivity = AuditLog::query()
            ->where('workspace_id', $workspaceId)
            ->with('actor')
            ->latest('occurred_at')
            ->take(5)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'event_type' => $log->event_type,
                'actor_name' => $log->actor->name ?? 'System',
                'occurred_at' => $log->occurred_at,
                'target_type' => $log->target_type,
                'metadata' => $log->metadata,
            ]);

        return [
            'stats' => [
                'total_courses' => $courseCount,
                'total_leads' => Lead::query()->where('workspace_id', $workspaceId)->count(),
                'total_members' => $memberCount,
            ],
            'recent_activity' => $recentActivity,
            'lead_distribution' => $leadStats,
        ];
    }
}
