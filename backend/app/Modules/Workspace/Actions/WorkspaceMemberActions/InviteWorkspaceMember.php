<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceMembersService;

class InviteWorkspaceMember
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService
    ) {
    }

    public function execute(array $data): array
    {
        $currentWorkspace = $this->workspaceContextService->currentWorkspace();

        if ($currentWorkspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $currentMemberShip = $this->workspaceContextService->currentMembership();

        if ($currentMemberShip === null) {
            throw WorkspaceContextException::notAMember($currentWorkspace->id);
        }

        $this->handleRoles($currentWorkspace, $data);

        // TODO: Create a workspace invitation record and dispatch the invitation email.
        return ['invitation' => null];
    }

    private function handleRoles(Workspace $workspace, array $data): Role
    {
        // flow:
        // 1. ensure role is valid (if provided) and assign default role if not provided
        // 2. create a workspace invitation record with pending status
        // 3. dispatch an email to the invitee with accept/decline links containing a secure token
        // 4. return the invitation record (or at least its id and status) in the response
        // 5. (later) handle edge cases like re-inviting an already invited email, or inviting an existing member

        // --
        // 1 : check if role is provided
        // 2 : if provided check if its valid (exists in the workspace)
        // 3 : if not provided assign the workspace weakest non-Owner role
        if (isset($data['role_id']) && $data['role_id'] !== null) {
            $role = $workspace->roles()
                ->whereKey((int) $data['role_id'])
                ->first();

            if ($role === null) {
                throw WorkspaceContextException::invalidInviteRole((int) $data['role_id'], $workspace->id);
            }

            // the provided role is valid and belongs to the active workspace,
            // but Owner should never be assigned through an invitation.
            if ($role->name === 'Owner') {
                throw WorkspaceContextException::ownerRoleCannotBeAssigned($workspace->id);
            }

            return $role;
        }

        $fallbackRole = $workspace->weakestRole();

        if ($fallbackRole === null) {
            throw WorkspaceContextException::inviteRoleUnavailable($workspace->id);
        }

        return $fallbackRole;
    }
}
