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

class EmptyTrashAction
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContext,
        private readonly AuditLogger $auditLogger
    ) {}

    public function execute(User $actor): array
    {
        $workspace = $this->workspaceContext->currentWorkspace();

        return DB::transaction(function () use ($workspace, $actor) {
            $deletedTasksCount = Task::onlyTrashed()
                ->withoutGlobalScopes()
                ->where('workspace_id', $workspace->id)
                ->forceDelete();

            $deletedProjectsCount = Project::onlyTrashed()
                ->withoutGlobalScopes()
                ->where('workspace_id', $workspace->id)
                ->forceDelete();

            $totalDeleted = $deletedTasksCount + $deletedProjectsCount;

            $this->auditLogger->record(
                workspace: $workspace,
                action: AuditAction::WorkspaceUpdated,
                targetType: AuditTargetType::Workspace,
                targetId: $workspace->id,
                actor: $actor,
                metadata: [
                    'action' => 'empty_trash',
                    'purged_tasks' => $deletedTasksCount,
                    'purged_projects' => $deletedProjectsCount,
                ]
            );

            return [
                'purged' => true,
                'total_purged' => $totalDeleted,
                'purged_tasks' => $deletedTasksCount,
                'purged_projects' => $deletedProjectsCount,
                'message' => "Trash emptied. {$totalDeleted} items permanently removed.",
            ];
        });
    }
}
