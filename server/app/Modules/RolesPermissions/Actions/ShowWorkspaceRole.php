<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Services\WorkspaceRoleManagementService;

class ShowWorkspaceRole
{
    public function __construct(
        private readonly WorkspaceRoleManagementService $workspaceRoleManagementService
    ) {}

    public function execute(int $roleId): array
    {
        $workspace = $this->workspaceRoleManagementService->currentWorkspace();

        return [
            'role' => $this->workspaceRoleManagementService->resolveWorkspaceRole($workspace, $roleId),
        ];
    }
}
