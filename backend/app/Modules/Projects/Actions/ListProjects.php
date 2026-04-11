<?php

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Services\ProjectService;
use Illuminate\Database\Eloquent\Collection;

class ListProjects
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {
    }

    public function execute(array $filters = []): Collection
    {
        return $this->projectService->listProjects(
            $this->projectService->currentWorkspace(),
            $filters
        );
    }
}
