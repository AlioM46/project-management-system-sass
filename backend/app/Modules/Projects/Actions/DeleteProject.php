<?php

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Services\ProjectService;

class DeleteProject
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {
    }

    public function execute(int $projectId): void
    {
        $workspace = $this->projectService->currentWorkspace();
        $project = $this->projectService->resolveProject($workspace, $projectId, true);

        $this->projectService->deleteProject($project);
    }
}
