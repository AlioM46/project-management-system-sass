<?php

namespace App\Modules\Workspace\Services;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

class WorkspaceMembersService
{
    public function isMemberOfWorkspace(Workspace $workspace, int $userId): bool
    {
        return Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $userId)
            ->exists();
    }

    public function isUserEmailMemberOfWorkspace(Workspace $workspace, string $email): bool
    {
        return Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->whereHas('user', function ($query) use ($email) {
                $query->where('email', $email);
            })
            ->exists();
    }

    public function countOtherMembers(Workspace $workspace, int $currentMembershipId): int
    {
        return Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->where('id', '!=', $currentMembershipId)
            ->whereHas('user')
            ->count();
    }

    /**
     * Pick the next owner when the current owner leaves.
     *
     * Rules:
     * - use the explicit successor when provided
     * - otherwise auto-pick the oldest Admin
     * - if no Admin exists, use the oldest remaining member
     */
    public function resolveSuccessorForOwnerLeave(
        Workspace $workspace,
        int $currentMembershipId,
        ?int $successorMemberId
    ): Workspace_Members {
        if ($successorMemberId !== null) {
            return $this->resolveExplicitSuccessor($workspace, $currentMembershipId, $successorMemberId);
        }

        return $this->resolveAutomaticSuccessor($workspace, $currentMembershipId);
    }

    public function assignOwnerToMembership(Workspace $workspace, Workspace_Members $selectedMembership): void
    {
        $ownerRoleId = $this->roleIdByName($workspace, 'Owner');

        if ($ownerRoleId === null) {
            throw WorkspaceContextException::workspaceRoleNotFound('Owner', $workspace->id);
        }

        $workspace->created_by_user_id = $selectedMembership->user_id;
        // Suggested: replace editing created_by_user_id field, with more semantic approach like having an owner_id field in workspace table.
        // but for now, we will keep it as is to avoid more changes.
        $workspace->save();

        $selectedMembership->role_id = $ownerRoleId;
        $selectedMembership->save();
    }

    public function removeMembership(Workspace_Members $membership): void
    {
        $membership->delete();
    }

    /**
     * Validate a user-selected successor against the current workspace members.
     *
     * The id here is workspace_members.id, not users.id.
     */
    private function resolveExplicitSuccessor(
        Workspace $workspace,
        int $currentMembershipId,
        int $successorMemberId
    ): Workspace_Members {
        // the query function, could be more simplified, but for DRY concept, I will use it.
        // you just need to lookup for :
            // member is valid , the successor is not the current membership, and the successor has a user (is not an orphaned membership)
            // others like (order, nulls, etc) are not relevant in explicit selection, but we keep them for consistency with the automatic selection logic)
        $membership = $this->explicitSuccessorCandidatesQuery($workspace, $currentMembershipId)
            ->whereKey($successorMemberId)
            ->first();

        if ($membership === null) {
            throw WorkspaceContextException::invalidSuccessorMember($successorMemberId, $workspace->id);
        }

        return $membership;
    }

    private function explicitSuccessorCandidatesQuery(Workspace $workspace, int $currentMembershipId) {
        return Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->where('id', '!=', $currentMembershipId)
            ->whereHas('user');
    }

    /**
     * Auto-pick the successor using the simple priority agreed for owner leave:
     * oldest Admin first, otherwise oldest remaining member.
     */
    private function resolveAutomaticSuccessor(Workspace $workspace, int $currentMembershipId): Workspace_Members
    {
        $adminRoleId = $this->roleIdByName($workspace, 'Admin');

        if ($adminRoleId !== null) {
            $adminMembership = $this->successorCandidatesQuery($workspace, $currentMembershipId)
                ->where('role_id', $adminRoleId)
                ->first();

            if ($adminMembership !== null) {
                return $adminMembership;
            }
        }

        $oldestGeneralMembership = $this->successorCandidatesQuery($workspace, $currentMembershipId)->first();

        if ($oldestGeneralMembership === null) {
            throw WorkspaceContextException::noEligibleSuccessor($workspace->id);
        }

        return $oldestGeneralMembership;
    }

    /**
     * Base candidate list for ownership transfer.
     *
     * Excludes the leaving owner, keeps only memberships with a real user row,
     * then sorts by oldest joined member first. Null joined_at values go last.
     */
    private function successorCandidatesQuery(Workspace $workspace, int $currentMembershipId)
    {
        return Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->where('id', '!=', $currentMembershipId)
            ->whereHas('user')
             // why not ordering directly by joined_at with nulls?
             // because in some databases (e.g. MySQL) nulls are sorted first by default, and we want them last
             // so first, we order by the new case Expression, then the resort the values of non-null joined_at in asc order, then by id to make the order deterministic in case of same joined_at including nulls.
            ->orderByRaw('CASE WHEN joined_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('joined_at')
            ->orderBy('id');

            /* 
            Equals To:

            SELECT wm.*, CASE WHEN wm.joined_at IS NULL THEN 1 ELSE 0 END as CASE_RESULT
            FROM workspace_members AS wm

            WHERE wm.workspace_id = 1
              AND wm.id <> 104
              AND EXISTS (
                  SELECT 1
                  FROM dbo.users AS u
                  WHERE u.id = wm.user_id
              )
              order by CASE_RESULT, joined_at, user_id
            */
    }

    public function roleIdByName(Workspace $workspace, string $roleName): ?int
    {
        return Role::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->where('name', $roleName)
            ->value('id');
    }
}
