<?php

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Model\Project;
use App\Modules\Projects\Services\ProjectService;

class GetProject
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {
    }

    public function execute(int $projectId, bool $includeDeleted = false): Project
    {
        return $this->projectService->resolveProject(
            $this->projectService->currentWorkspace(),
            $projectId,
            $includeDeleted
        );
    }
}
