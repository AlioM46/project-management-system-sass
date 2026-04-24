<?php

namespace App\Modules\Tasks\Actions;

use App\Modules\Tasks\Services\TaskAssignmentService;
use App\Modules\Tasks\Services\TaskService;
use Illuminate\Database\Eloquent\Collection;

class GetAssignees
{
    public function __construct(
        private readonly TaskService $taskService,
        private readonly TaskAssignmentService $taskAssignmentService
    ) {}

    public function execute(int $taskId): Collection
    {
        $task = $this->taskService->getTask(
            $this->taskService->currentWorkspace(),
            $taskId
        );

        return $this->taskAssignmentService->getAssignees($task);
    }
}
