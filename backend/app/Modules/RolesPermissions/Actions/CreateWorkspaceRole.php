<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Models\User;
use App\Modules\RolesPermissions\Services\WorkspaceRoleManagementService;

class CreateWorkspaceRole
{
    public function __construct(
        private readonly WorkspaceRoleManagementService $workspaceRoleManagementService
    ) {}

    public function execute(array $data, User $actor): array
    {
        $workspace = $this->workspaceRoleManagementService->currentWorkspace();

        return [
            'role' => $this->workspaceRoleManagementService->createCustomRole($workspace, $data, $actor),
        ];
    }
}
