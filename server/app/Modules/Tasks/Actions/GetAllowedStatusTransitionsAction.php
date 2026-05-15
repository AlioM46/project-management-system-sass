<?php

namespace App\Modules\Tasks\Actions;

use App\Models\User;
use App\Modules\Tasks\Services\TaskService;
use App\Modules\Workspace\Services\WorkspaceContextService;

class GetAllowedStatusTransitionsAction
{
    public function __construct(
        private readonly TaskService $taskService,
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function execute(int $taskId): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        $task = $this->taskService->resolveActiveTask($workspace, $taskId);

        return [
            "current_status" => $task->status,
            "allowed_transitions" => $this->taskService->allowedTrasitions($task->status)
        ];
    }
}
