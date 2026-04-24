<?php

namespace App\Modules\Projects\Actions;

use App\Modules\Projects\Model\Project;
use App\Modules\Projects\Services\ProjectService;

class RestoreProject
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {}

    public function execute(int $projectId): Project
    {
        $workspace = $this->projectService->currentWorkspace();
        $project = $this->projectService->resolveProject($workspace, $projectId, true);

        return $this->projectService->restoreProject($project);
    }
}
