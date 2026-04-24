<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Mail\WorkspaceInviteMail;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceInvitationService;
use App\Modules\Workspace\Services\WorkspaceMembersService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class InviteWorkspaceMember
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService,
        private readonly WorkspaceInvitationService $workspaceInvitationService
    ) {}

    public function execute(array $data): array
    {
        $currentWorkspace = $this->workspaceContextService->currentWorkspace();

        if ($currentWorkspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $currentMembership = $this->workspaceContextService->currentMembership();

        if ($currentMembership === null) {
            throw WorkspaceContextException::notAMember($currentWorkspace->id);
        }

        $inviteeEmail = $this->workspaceInvitationService->normalizeEmail((string) $data['email']);
        $inviterEmail = $this->workspaceInvitationService->normalizeEmail((string) ($currentMembership->user?->email ?? ''));

        if ($inviteeEmail === $inviterEmail && $inviterEmail !== '') {
            throw WorkspaceContextException::cannotInviteSelf($currentWorkspace->id);
        }

        if ($this->workspaceMembersService->isUserEmailMemberOfWorkspace($currentWorkspace, $inviteeEmail)) {
            throw WorkspaceContextException::inviteEmailAlreadyMember($inviteeEmail, $currentWorkspace->id);
        }

        $invitedUserRole = $this->handleRoles($currentWorkspace, $data);
        $plainToken = $this->workspaceInvitationService->generatePlainToken();
        $tokenHash = $this->workspaceInvitationService->hashToken($plainToken);
        $expiresAt = $this->workspaceInvitationService->defaultExpiryAt();
        $inviteMessage = isset($data['message']) ? trim((string) $data['message']) : null;

        $invitation = DB::transaction(function () use (
            $currentWorkspace,
            $inviteeEmail,
            $currentMembership,
            $inviteMessage,
            $invitedUserRole,
            $tokenHash,
            $expiresAt,
            $plainToken
        ) {
            $invitation = $this->workspaceInvitationService->upsertPendingInvitation(
                workspace: $currentWorkspace,
                email: $inviteeEmail,
                role: $invitedUserRole,
                invitedByUserId: (int) $currentMembership->user_id,
                message: $inviteMessage,
                tokenHash: $tokenHash,
                expiresAt: $expiresAt
            );

            $acceptUrl = $this->workspaceInvitationService->buildAcceptUrl($invitation->id, $plainToken);

            Mail::to($inviteeEmail)->send(
                new WorkspaceInviteMail(
                    workspaceName: (string) $currentWorkspace->name,
                    roleName: (string) $invitedUserRole->name,
                    inviteeEmail: $inviteeEmail,
                    inviterName: (string) ($currentMembership->user?->name ?? 'A workspace member'),
                    acceptUrl: $acceptUrl,
                    expiresAt: $expiresAt,
                    message: $inviteMessage
                )
            );

            $invitation->sent_at = now();
            $invitation->save();

            return $invitation;
        });

        return [
            'invitation' => [
                'id' => $invitation->id,
                'workspace_id' => $invitation->workspace_id,
                'email' => $invitation->email,
                'role_id' => $invitation->role_id,
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at,
                'sent_at' => $invitation->sent_at,
            ],
        ];
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
            if ($role->isOwnerRole()) {
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
