<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Mail\WorkspaceInviteMail;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceInvitationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ResendInvite
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceInvitationService $workspaceInvitationService,
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function execute(int $invitationId, User $user): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $currentMembership = $this->workspaceContextService->currentMembership();

        if ($currentMembership === null) {
            throw WorkspaceContextException::notAMember($workspace->id);
        }

        return DB::transaction(function () use ($workspace, $currentMembership, $invitationId, $user) {
            $invitation = WorkspaceInvitation::query()
                ->with(['role', 'inviter'])
                ->whereKey($invitationId)
                ->where('workspace_id', $workspace->id)
                ->lockForUpdate()
                ->first();

            if ($invitation === null) {
                throw WorkspaceContextException::invitationNotFound($invitationId, $workspace->id);
            }

            $invitation = $this->workspaceInvitationService->normalizeInvitationStatus($invitation);

            if ($invitation->status === 'accepted') {
                throw WorkspaceContextException::invitationAlreadyHandled($invitation->id, $invitation->status);
            }

            $isInviter = (int) $invitation->invited_by_user_id === (int) $user->id;
            $isWorkspaceOwner = $currentMembership->isOwner();

            if (!$isInviter && !$isWorkspaceOwner) {
                throw WorkspaceContextException::insufficientPermissionToResendInvite($workspace->id);
            }

            if ($invitation->role === null) {
                throw WorkspaceContextException::inviteRoleUnavailable($workspace->id);
            }

            $plainToken = $this->workspaceInvitationService->generatePlainToken();
            $tokenHash = $this->workspaceInvitationService->hashToken($plainToken);
            $expiresAt = $this->workspaceInvitationService->defaultExpiryAt();

            $invitation = $this->workspaceInvitationService->refreshInvitationForSending(
                invitation: $invitation,
                role: $invitation->role,
                invitedByUserId: (int) $currentMembership->user_id,
                message: $invitation->message,
                tokenHash: $tokenHash,
                expiresAt: $expiresAt
            );

            $acceptUrl = $this->workspaceInvitationService->buildAcceptUrl($invitation->id, $plainToken);

            Mail::to($invitation->email)->send(
                new WorkspaceInviteMail(
                    workspaceName: (string) $workspace->name,
                    roleName: (string) $invitation->role->name,
                    inviteeEmail: (string) $invitation->email,
                    inviterName: (string) ($currentMembership->user?->name ?? 'A workspace member'),
                    acceptUrl: $acceptUrl,
                    expiresAt: $expiresAt,
                    message: $invitation->message
                )
            );

            $this->workspaceInvitationService->markInvitationSent($invitation);

            $this->auditLogger->record(
                workspace: $workspace,
                action: AuditAction::MemberInvited,
                targetType: AuditTargetType::WorkspaceInvitation,
                targetId: $invitation->id,
                actor: $currentMembership->user,
                newValues: [
                    'email' => $invitation->email,
                    'role_id' => $invitation->role_id,
                    'status' => $invitation->status,
                    'expires_at' => $invitation->expires_at?->toISOString(),
                ],
                metadata: [
                    AuditMetadataKey::InvitationId->value => $invitation->id,
                    AuditMetadataKey::InvitationEmail->value => $invitation->email,
                    AuditMetadataKey::RoleId->value => $invitation->role_id,
                ]
            );

            return [
                'invitation' => $this->workspaceInvitationService->serializeInvitation($invitation),
            ];
        });
    }
}
