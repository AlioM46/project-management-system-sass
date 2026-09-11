<?php

namespace App\Modules\Projects\Actions;

use App\Models\User;
use App\Modules\Billing\Services\PlanLimitService;
use App\Modules\Projects\Model\Project;
use App\Modules\Projects\Services\ProjectService;

class CreateProject
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly PlanLimitService $planLimitService
    ) {}

    public function execute(array $data, User $actor): Project
    {
        $workspace = $this->projectService->currentWorkspace();

        $this->planLimitService->enforceMaxProjects($workspace);

        return $this->projectService->createProject(
            $workspace,
            $data,
            $actor
        );
    }
}
