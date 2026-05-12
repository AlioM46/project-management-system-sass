<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Models\User;
use App\Modules\RolesPermissions\Services\WorkspaceRoleManagementService;

class UpdateWorkspaceRolePermissions
{
    public function __construct(
        private readonly WorkspaceRoleManagementService $workspaceRoleManagementService
    ) {}

    public function execute(int $roleId, array $data, User $actor): array
    {
        $workspace = $this->workspaceRoleManagementService->currentWorkspace();
        $role = $this->workspaceRoleManagementService->resolveWorkspaceRole($workspace, $roleId);

        return [
            'role' => $this->workspaceRoleManagementService->replacePermissions($role, $data['permissions'], $actor),
        ];
    }
}
