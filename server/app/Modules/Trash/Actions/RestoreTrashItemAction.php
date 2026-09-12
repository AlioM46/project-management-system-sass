<?php

declare(strict_types=1);

namespace App\Modules\Trash\Actions;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RestoreTrashItemAction
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContext,
        private readonly AuditLogger $auditLogger
    ) {}

    public function execute(string $type, int|string $id, User $actor): array
    {
        $workspace = $this->workspaceContext->currentWorkspace();
        $normalizedType = strtolower(trim($type));

        return DB::transaction(function () use ($workspace, $normalizedType, $id, $actor) {
            if ($normalizedType === 'task' || $normalizedType === 'tasks') {
                $task = Task::onlyTrashed()
                    ->withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('id', $id)
                    ->firstOrFail();

                // If task belongs to a deleted project, ensure project is also restored
                if ($task->project_id) {
                    $parentProject = Project::withTrashed()
                        ->withoutGlobalScopes()
                        ->where('workspace_id', $workspace->id)
                        ->find($task->project_id);

                    if ($parentProject && $parentProject->trashed()) {
                        $parentProject->restore();
                    }
                }

                $task->restore();

                $this->auditLogger->record(
                    workspace: $workspace,
                    action: AuditAction::TaskRestored,
                    targetType: AuditTargetType::Task,
                    targetId: $task->id,
                    actor: $actor,
                    newValues: ['status' => $task->status]
                );

                return [
                    'restored' => true,
                    'type' => 'task',
                    'id' => $task->id,
                    'title' => $task->title,
                    'message' => 'Task restored successfully.',
                ];
            }

            if ($normalizedType === 'project' || $normalizedType === 'projects') {
                $project = Project::onlyTrashed()
                    ->withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('id', $id)
                    ->firstOrFail();

                $project->restore();

                // Cascade restoration: restore all tasks that belonged to this project
                $restoredTasksCount = Task::onlyTrashed()
                    ->withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('project_id', $project->id)
                    ->restore();

                $this->auditLogger->record(
                    workspace: $workspace,
                    action: AuditAction::ProjectRestored,
                    targetType: AuditTargetType::Project,
                    targetId: $project->id,
                    actor: $actor,
                    newValues: ['name' => $project->name]
                );

                return [
                    'restored' => true,
                    'type' => 'project',
                    'id' => $project->id,
                    'title' => $project->name,
                    'restored_tasks_count' => $restoredTasksCount,
                    'message' => "Project restored successfully with {$restoredTasksCount} tasks.",
                ];
            }

            throw new InvalidArgumentException("Invalid item type: {$type}. Supported types are 'task' and 'project'.");
        });
    }
}
