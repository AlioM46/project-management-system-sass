<?php

namespace App\Modules\Tasks\Actions;

use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Services\TaskService;

class GetTask
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    public function execute(int $taskId): Task
    {
        return $this->taskService->getTask(
            $this->taskService->currentWorkspace(),
            $taskId
        );
    }
}
