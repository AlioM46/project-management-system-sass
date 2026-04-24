<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Services\WorkspaceRoleManagementService;

class UpdateWorkspaceRole
{
    public function __construct(
        private readonly WorkspaceRoleManagementService $workspaceRoleManagementService
    ) {}

    public function execute(int $roleId, array $data): array
    {
        $workspace = $this->workspaceRoleManagementService->currentWorkspace();
        $role = $this->workspaceRoleManagementService->resolveWorkspaceRole($workspace, $roleId);

        return [
            'role' => $this->workspaceRoleManagementService->updateCustomRole($role, $data),
        ];
    }
}
