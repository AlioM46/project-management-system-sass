<?php

namespace App\Modules\Tasks\Actions;

use App\Models\User;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Services\TaskAssignmentService;
use App\Modules\Tasks\Services\TaskService;

class AddAssignees
{
    public function __construct(
        private readonly TaskService $taskService,
        private readonly TaskAssignmentService $taskAssignmentService
    ) {
    }

    public function execute(int $taskId, array $userIds, User $actor): Task
    {
        $task = $this->taskService->resolveActiveTask(
            $this->taskService->currentWorkspace(),
            $taskId
        );

        return $this->taskAssignmentService->addAssignees($task, $userIds, $actor);
    }
}
