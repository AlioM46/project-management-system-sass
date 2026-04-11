<?php

namespace App\Modules\Projects\Actions;

use App\Models\User;
use App\Modules\Projects\Model\Project;
use App\Modules\Projects\Services\ProjectService;

class CreateProject
{
    public function __construct(
        private readonly ProjectService $projectService
    ) {
    }

    public function execute(array $data, User $actor): Project
    {
        return $this->projectService->createProject(
            $this->projectService->currentWorkspace(),
            $data,
            $actor
        );
    }
}
