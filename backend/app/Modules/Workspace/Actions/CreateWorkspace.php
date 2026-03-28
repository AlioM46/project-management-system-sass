<?php

namespace App\Modules\Workspace\Actions;

use App\Models\User;
use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Support\Facades\DB;

class CreateWorkspace
{
    public function __construct(
        private readonly WorkspaceRoleProvisioningService $workspaceRoleProvisioningService
    ) {
    }

    /**
     * Create a workspace and its initial access-control setup.
     *
     * Flow:
     * 1. create workspace row
     * 2. provision Owner/Admin/Member roles
     * 3. assign the creator to the Owner role
     *
     * Result:
     * Workspace with owner/members relations loaded.
     */
    public function execute(array $data, User $user): Workspace
    {
        return DB::transaction(function () use ($data, $user) {
            $workspace = $this->createWorkspaceRecord($data, $user);
            $defaultRoles = $this->workspaceRoleProvisioningService->provisionForWorkspace($workspace);
            $this->createOwnerMembership($workspace, $user, $defaultRoles['owner']->id);

            return $workspace->load([
                'owner:id,name,email',
                'members.user:id,name,email',
            ])->loadCount('members');
        });
    }

    /**
     * Insert the workspace row.
     *
     * Result example:
     * Workspace { id: 10, name: "Delivery Workspace" }
     */
    private function createWorkspaceRecord(array $data, User $user): Workspace
    {
        return Workspace::query()->create([
            'name' => $data['name'],
            'created_by_user_id' => $user->id,
        ]);
    }

    /**
     * Add the creator to workspace_members using the Owner role id.
     */
    private function createOwnerMembership(Workspace $workspace, User $user, int $ownerRoleId): void
    {
        Workspace_Members::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role_id' => $ownerRoleId,
            'joined_at' => now(),
        ]);
    }
}
