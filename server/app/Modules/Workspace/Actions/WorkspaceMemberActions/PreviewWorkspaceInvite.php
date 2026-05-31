<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Services\WorkspaceInvitationService;

class PreviewWorkspaceInvite
{
    public function __construct(
        private readonly WorkspaceInvitationService $workspaceInvitationService
    ) {
    }

    public function execute(array $data): array
    {
        $invitationId = (int) $data['invitation_id'];
        $plainToken = (string) $data['token'];

        $invitation = WorkspaceInvitation::query()
            ->whereKey($invitationId)
            ->first();

        if ($invitation === null) {
            throw WorkspaceContextException::invalidInvitationToken();
        }

        if (! $this->workspaceInvitationService->tokenMatches($invitation, $plainToken)) {
            throw WorkspaceContextException::invalidInvitationToken();
        }

        $invitation = $this->workspaceInvitationService->normalizeInvitationStatus($invitation);

        return [
            'invitation' => $this->workspaceInvitationService->serializeInvitation($invitation),
        ];
    }
}
