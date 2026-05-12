<?php

namespace App\Modules\Projects\Actions;

use App\Models\User;
use App\Modules\Projects\Model\Project;
use App\Modules\Projects\Services\ProjectService;

class UpdateProject
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {}

    public function execute(int $projectId, array $data, User $actor): Project
    {
        $workspace = $this->projectService->currentWorkspace();
        $project = $this->projectService->resolveProject($workspace, $projectId, true);

        return $this->projectService->updateProject($project, $data, $actor);
    }
}
