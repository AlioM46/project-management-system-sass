<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceMembersService;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;

class RemoveWorkspaceMember
{
    private Workspace $workspace;
    private Workspace_Members $currentMembership;

    private int $ownerRoleId;
    private int $adminRoleId;

    private int $workspaceOwnerId;
    private int $currentUserId;

    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService
    ) {
    }

    /**
     * Execute member removal with proper authorization and validation.
     *
     * Process:
     * 1. Load and validate workspace context
     * 2. Prevent owner from being removed
     * 3. Check current user permissions
     * 4. Delete membership record
     * 5. Return removed member data
     */
    public function execute(int $memberId): array
    {
        $this->validateAndInitialize();
        $member = $this->workspaceMembersService->resolveWorkspaceMember($this->workspace, $memberId);
        $this->validateMemberNotOwner($member);
        $this->validateRemovalPermission($member);

        $this->workspaceMembersService->removeMembership($member);

        return ['member' => $this->formatRemovedMemberData($member)];
    }

    /**
     * Initialize and validate workspace context.
     *
     * Process:
     * 1. Retrieve current workspace from request context
     * 2. Verify workspace exists (throws exception if missing)
     * 3. Retrieve current user's membership
     * 4. Verify user is a member (throws exception if not)
     * 5. Store workspace context and role IDs as class properties for reuse
     * 6. Cache workspace owner ID and current user ID to avoid repeated casts
     *
     * Errors:
     * - WORKSPACE_CONTEXT_REQUIRED: Workspace not set in current request
     * - WORKSPACE_CONTEXT_FORBIDDEN: User is not a member of workspace
     */
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

        $this->workspaceOwnerId = (int) $workspace->created_by_user_id;
        $this->currentUserId = (int) $currentMembership->user_id;
        
        $this->ownerRoleId = (int) ($this->workspaceMembersService->roleIdBySlug($workspace, \App\Modules\RolesPermissions\Model\Role::OWNER_SLUG) ?? 0);
        $this->adminRoleId = (int) ($this->workspaceMembersService->roleIdBySlug($workspace, \App\Modules\RolesPermissions\Model\Role::ADMIN_SLUG) ?? 0);
    }

    /**
     * Validate that target member is not the workspace owner.
     *
     * Business Rule:
     * - Owner role is immutable and cannot be removed from the system
     * - Ownership must be transferred before removal
     *
     * Error: WORKSPACE_CONTEXT_OWNER_CANNOT_BE_REMOVED
     */
    private function validateMemberNotOwner(Workspace_Members $member): void
    {
        if ((int) $member->user_id === $this->workspaceOwnerId) {
            throw WorkspaceContextException::ownerCannotBeRemoved($this->workspace->id);
        }
    }

    /**
     * Validate current user has permission to remove target member.
     *
     * Process:
     * 1. If current user is owner, allow removal (owner can remove anyone)
     * 2. If current user is not owner, check admin permissions
     * 3. Throw exception if user lacks permission
     *
     * Permissions:
     * - OWNER: Can remove any member (except owner themselves, already blocked)
     * - ADMIN: Can remove non-admin members only
     * - Others: Cannot remove anyone
     *
     * Error: WORKSPACE_CONTEXT_INSUFFICIENT_PERMISSION_TO_REMOVE
     */
    private function validateRemovalPermission(Workspace_Members $member): void
    {
        if ($this->isCurrentUserOwner()) {
            return; // Owner can remove anyone
        }

        if (!$this->canCurrentUserRemoveMember($member)) {
            throw WorkspaceContextException::insufficientPermissionToRemove($this->workspace->id);
        }
    }

    /**
     * Check if current user is the workspace owner.
     *
     * Logic: Compare current user ID with workspace's created_by_user_id
     *
     * Return: true if user is owner, false otherwise
     */
    private function isCurrentUserOwner(): bool
    {
        return $this->currentUserId === $this->workspaceOwnerId;
    }

    /**
     * Check if current user has Admin role.
     *
     * Logic: Compare current membership's role_id with admin role ID
     *
     * Return: true if user is admin, false otherwise
     */
    private function isCurrentUserAdmin(): bool
    {
        return (int) $this->currentMembership->role_id === $this->adminRoleId;
    }

    /**
     * Check if target member has Admin role.
     *
     * Logic: Compare target membership's role_id with admin role ID
     *
     * Return: true if member is admin, false otherwise
     */
    private function isTargetMemberAdmin(Workspace_Members $member): bool
    {
        return (int) $member->role_id === $this->adminRoleId;
    }

    /**
     * Determine if current user can remove the target member.
     *
     * Business Rules:
     * 1. Only OWNER and ADMIN roles can remove members
     * 2. ADMIN roles cannot remove other ADMIN roles
     * 3. Non-admin roles cannot remove anyone
     *
     * Process:
     * 1. Check if current user is admin (non-owner path)
     * 2. Return false if user is not admin
     * 3. Check if target is also admin
     * 4. Return false if both are admin (admins cannot remove admins)
     * 5. Return true if target is not admin (admin can remove non-admins)
     *
     * Return: true if removal is allowed, false otherwise
     */
    private function canCurrentUserRemoveMember(Workspace_Members $member): bool
    {
        // Only admins can remove members (besides the owner who is already checked)
        if (!$this->isCurrentUserAdmin()) {
            return false;
        }

        // Admins cannot remove other admins
        if ($this->isTargetMemberAdmin($member)) {
            return false;
        }

        return true;
    }

    /**
     * Format the removed member data for API response.
     *
     * Process:
     * 1. Extract member ID, IDs, relationships
     * 2. Include user relationship for client context
     * 3. Include joined_at timestamp for audit trail
     * 4. Return as associative array for JSON serialization
     *
     * Return: Array containing member details ready for API response
     */
    private function formatRemovedMemberData(Workspace_Members $member): array
    {
        return [
            'id' => $member->id,
            'user_id' => $member->user_id,
            'user' => $member->user,
            'workspace_id' => $member->workspace_id,
            'role_id' => $member->role_id,
            'joined_at' => $member->joined_at,
        ];
    }
}
