<?php

declare(strict_types=1);

namespace App\Modules\Trash\Actions;

use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Carbon;

class ListTrashAction
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContext
    ) {}

    public function execute(?string $filterType = null): array
    {
        $workspaceId = $this->workspaceContext->currentWorkspaceId();
        $items = [];

        // 1. Fetch soft-deleted Projects
        if ($filterType === null || $filterType === 'all' || $filterType === 'projects' || $filterType === 'project') {
            $projects = Project::onlyTrashed()
                ->withoutGlobalScopes()
                ->where('workspace_id', $workspaceId)
                ->orderByDesc('deleted_at')
                ->get();

            foreach ($projects as $project) {
                $deletedAt = $project->deleted_at ?? now();
                $daysElapsed = (int) $deletedAt->diffInDays(now());
                $daysRemaining = max(0, 30 - $daysElapsed);

                $items[] = [
                    'id' => $project->id,
                    'type' => 'project',
                    'title' => $project->name,
                    'description' => $project->description,
                    'project_name' => null,
                    'deleted_at' => $deletedAt->toISOString(),
                    'days_remaining' => $daysRemaining,
                    'created_at' => $project->created_at?->toISOString(),
                ];
            }
        }

        // 2. Fetch soft-deleted Tasks
        if ($filterType === null || $filterType === 'all' || $filterType === 'tasks' || $filterType === 'task') {
            $tasks = Task::onlyTrashed()
                ->withoutGlobalScopes()
                ->where('workspace_id', $workspaceId)
                ->with(['project' => fn ($q) => $q->withTrashed()])
                ->orderByDesc('deleted_at')
                ->get();

            foreach ($tasks as $task) {
                $deletedAt = $task->deleted_at ?? now();
                $daysElapsed = (int) $deletedAt->diffInDays(now());
                $daysRemaining = max(0, 30 - $daysElapsed);

                $items[] = [
                    'id' => $task->id,
                    'type' => 'task',
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'project_name' => $task->project?->name ?? 'General',
                    'project_id' => $task->project_id,
                    'deleted_at' => $deletedAt->toISOString(),
                    'days_remaining' => $daysRemaining,
                    'created_at' => $task->created_at?->toISOString(),
                ];
            }
        }

        // Sort combined list by deleted_at descending
        usort($items, function ($a, $b) {
            return strcmp($b['deleted_at'], $a['deleted_at']);
        });

        return [
            'total' => count($items),
            'items' => $items,
        ];
    }
}

