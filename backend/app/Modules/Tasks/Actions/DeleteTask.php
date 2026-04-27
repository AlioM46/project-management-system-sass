<?php

namespace App\Modules\Tasks\Actions;

use App\Models\User;
use App\Modules\Tasks\Services\TaskService;

class DeleteTask
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    public function execute(int $taskId, User $actor): void
    {
        $task = $this->taskService->resolveActiveTask(
            $this->taskService->currentWorkspace(),
            $taskId
        );

        $this->taskService->deleteTask($task, $actor);
    }
}
