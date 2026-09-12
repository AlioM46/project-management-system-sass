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
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ForceDeleteTrashItemAction
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

                $taskTitle = $task->title;
                $taskId = $task->id;

                $task->forceDelete();

                $this->auditLogger->record(
                    workspace: $workspace,
                    action: AuditAction::TaskPermanentlyDeleted,
                    targetType: AuditTargetType::Task,
                    targetId: $taskId,
                    actor: $actor,
                    oldValues: ['title' => $taskTitle]
                );

                return [
                    'deleted' => true,
                    'type' => 'task',
                    'id' => $taskId,
                    'message' => 'Task permanently deleted.',
                ];
            }

            if ($normalizedType === 'project' || $normalizedType === 'projects') {
                $project = Project::onlyTrashed()
                    ->withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('id', $id)
                    ->firstOrFail();

                $projectName = $project->name;
                $projectId = $project->id;

                // Force delete associated tasks first
                Task::withTrashed()
                    ->withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('project_id', $projectId)
                    ->forceDelete();

                $project->forceDelete();

                $this->auditLogger->record(
                    workspace: $workspace,
                    action: AuditAction::ProjectPermanentlyDeleted,
                    targetType: AuditTargetType::Project,
                    targetId: $projectId,
                    actor: $actor,
                    oldValues: ['name' => $projectName]
                );

                return [
                    'deleted' => true,
                    'type' => 'project',
                    'id' => $projectId,
                    'message' => 'Project and its tasks permanently deleted.',
                ];
            }

            throw new InvalidArgumentException("Invalid item type: {$type}. Supported types are 'task' and 'project'.");
        });
    }
}
