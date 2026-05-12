<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Models\User;
use App\Modules\RolesPermissions\Services\WorkspaceRoleManagementService;

class DeleteWorkspaceRole
{
    public function __construct(
        private readonly WorkspaceRoleManagementService $workspaceRoleManagementService
    ) {}

    public function execute(int $roleId, User $actor): array
    {
        $workspace = $this->workspaceRoleManagementService->currentWorkspace();
        $role = $this->workspaceRoleManagementService->resolveWorkspaceRole($workspace, $roleId);

        $roleSnapshot = [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'workspace_id' => $role->workspace_id,
        ];

        $this->workspaceRoleManagementService->deleteCustomRole($role, $actor);

        return ['role' => $roleSnapshot];
    }
}
