<?php

namespace App\Modules\Tasks\Actions;

use App\Models\User;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Services\TaskService;

class CreateTask
{
    public function __construct(
        private readonly TaskService $taskService
    ) {
    }

    public function execute(array $data, User $actor): Task
    {
        return $this->taskService->createTask(
            $this->taskService->currentWorkspace(),
            $data,
            $actor
        );
    }
}
