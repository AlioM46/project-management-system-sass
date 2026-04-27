<?php

namespace App\Modules\Tasks\Actions;

use App\Modules\Tasks\Services\TaskService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListTasks
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    public function execute(array $filters = []): LengthAwarePaginator
    {
        return $this->taskService->listTasks(
            $this->taskService->currentWorkspace(),
            $filters
        );
    }
}
