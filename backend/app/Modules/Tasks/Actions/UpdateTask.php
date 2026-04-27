<?php

namespace App\Modules\Tasks\Actions;

use App\Models\User;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Services\TaskService;

class UpdateTask
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    public function execute(int $taskId, array $data, User $actor): Task
    {
        $task = $this->taskService->resolveActiveTask(
            $this->taskService->currentWorkspace(),
            $taskId
        );

        return $this->taskService->updateTask($task, $data, $actor);
    }
}
