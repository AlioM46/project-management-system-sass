<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceInvitationService;

class CancelInvite
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceInvitationService $workspaceInvitationService
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

        $invite = WorkspaceInvitation::query()
            ->whereKey($invitationId)
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($invite === null) {
            throw WorkspaceContextException::invitationNotFound($invitationId, $workspace->id);
        }

        $invite = $this->workspaceInvitationService->normalizeInvitationStatus($invite);

        if ($invite->status !== 'pending') {
            throw WorkspaceContextException::invitationAlreadyHandled($invite->id, $invite->status);
        }

        $isInviter = (int) $invite->invited_by_user_id === (int) $user->id;
        $isWorkspaceOwner = $currentMembership->isOwner();

        if (! $isInviter && ! $isWorkspaceOwner) {
            throw WorkspaceContextException::insufficientPermissionToCancelInvite($workspace->id);
        }

        $invite->status = 'cancelled';
        $invite->revoked_at = now();
        $invite->save();

        return [
            'invitation' => $this->workspaceInvitationService->serializeInvitation($invite),
        ];
    }
}
