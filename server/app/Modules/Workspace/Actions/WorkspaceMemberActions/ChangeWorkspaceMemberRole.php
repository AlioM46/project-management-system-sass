<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceMembersService;
use Illuminate\Support\Facades\DB;

class ChangeWorkspaceMemberRole
{
    private Workspace $workspace;

    private Workspace_Members $currentMembership;

    private int $ownerRoleId;

    private int $adminRoleId;

    private int $workspaceOwnerUserId;

    private int $currentUserId;

    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService,
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function execute(int $memberId, array $data): array
    {
        // #1: load the active workspace and the current user's membership.
        $this->validateAndInitialize();

        // #2: load the target membership only from the active workspace.
        $targetMembership = $this->workspaceMembersService->resolveWorkspaceMember($this->workspace, $memberId);

        // #3: prevent changing your own membership through this endpoint.
        $this->validateTargetIsNotCurrentUser($targetMembership);

        // #4: prevent changing the actual workspace owner through this endpoint.
        // eg: the target user is workspace_created_by_user_id
        // or the target role is Owner role.
        $this->validateTargetIsNotWorkspaceOwner($targetMembership);

        // #5: load the new role only from the current workspace.
        $newRole = $this->resolveWorkspaceRole((int) $data['role_id']);

        // #6: prevent assigning the Owner role here.
        $this->validateRoleIsAssignable($newRole);

        // #7: apply owner/admin hierarchy rules.
        $this->validateRoleChangePermission($targetMembership, $newRole);

        // #8: save only when the role actually changes.
        $oldRoleId = (int) $targetMembership->role_id;

        if ($oldRoleId !== (int) $newRole->id) {
            DB::transaction(function () use ($targetMembership, $newRole, $oldRoleId): void {
                $targetMembership->role()->associate($newRole);
                $targetMembership->save();

                $this->auditLogger->record(
                    workspace: $this->workspace,
                    action: AuditAction::MemberRoleChanged,
                    targetType: AuditTargetType::WorkspaceMember,
                    targetId: $targetMembership->id,
                    actor: $this->currentMembership->user,
                    oldValues: ['role_id' => $oldRoleId],
                    newValues: ['role_id' => $newRole->id]
                );
            });
        }

        // #9: return the updated membership with user + role relations.
        $targetMembership->load([
            'user:id,name,email',
            'role:id,workspace_id,name,description,is_system',
        ]);

        return ['member' => $targetMembership];
    }

    private function validateAndInitialize(): void
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $currentMembership = $this->workspaceContextService->currentMembership();

        if ($currentMembership === null) {
            throw WorkspaceContextException::notAMember($workspace->id);
        }

        $this->workspace = $workspace;
        $this->currentMembership = $currentMembership;
        $this->workspaceOwnerUserId = (int) $workspace->created_by_user_id;
        $this->currentUserId = (int) $currentMembership->user_id;
        $this->ownerRoleId = (int) ($this->workspaceMembersService->roleIdBySlug($workspace, Role::OWNER_SLUG) ?? 0);
        $this->adminRoleId = (int) ($this->workspaceMembersService->roleIdBySlug($workspace, Role::ADMIN_SLUG) ?? 0);
    }

    private function validateTargetIsNotCurrentUser(Workspace_Members $targetMembership): void
    {
        if ((int) $targetMembership->user_id === $this->currentUserId) {
            throw WorkspaceContextException::cannotChangeOwnRole($this->workspace->id);
        }
    }

    private function validateTargetIsNotWorkspaceOwner(Workspace_Members $targetMembership): void
    {
        if (
            (int) $targetMembership->user_id === $this->workspaceOwnerUserId
            || (int) $targetMembership->role_id === $this->ownerRoleId
        ) {
            throw WorkspaceContextException::ownerRoleCannotBeChanged($this->workspace->id);
        }
    }

    private function resolveWorkspaceRole(int $roleId): Role
    {
        $role = Role::query()->whereKey($roleId)->first();

        if ($role === null) {
            throw WorkspaceContextException::invalidMemberRole($roleId, $this->workspace->id);
        }

        return $role;
    }

    private function validateRoleIsAssignable(Role $newRole): void
    {
        if ($newRole->isOwnerRole()) {
            throw WorkspaceContextException::ownerRoleCannotBeAssignedThroughMemberUpdate($this->workspace->id);
        }
    }

    private function validateRoleChangePermission(Workspace_Members $targetMembership, Role $newRole): void
    {
        // Owner path:
        // Owner can change any non-owner member to any non-owner role.
        if ($this->isCurrentUserOwner()) {
            return;
        }

        // Admin path:
        // 1. must currently be admin
        // 2. cannot edit another admin
        // 3. cannot assign admin

        // if not owner, must be admin to proceed with any role change.
        if (!$this->isCurrentUserAdmin()) {
            throw WorkspaceContextException::insufficientPermissionToChangeRole($this->workspace->id);
        }

        // cannot edit another admin.
        if ($this->isTargetMembershipAdmin($targetMembership)) {
            throw WorkspaceContextException::insufficientPermissionToChangeRole($this->workspace->id);
        }

        // cannot assign admin role to anyone.
        // for other roles like owner, the check is done in validateRoleIsAssignable() method.
        if ((int) $newRole->id === $this->adminRoleId) {
            throw WorkspaceContextException::insufficientPermissionToChangeRole($this->workspace->id);
        }
    }

    private function isCurrentUserOwner(): bool
    {
        return $this->workspaceContextService->isOwner();
    }

    private function isCurrentUserAdmin(): bool
    {
        return $this->workspaceContextService->isAdmin();
    }

    private function isTargetMembershipAdmin(Workspace_Members $targetMembership): bool
    {
        return $targetMembership->isAdmin();
    }
}
