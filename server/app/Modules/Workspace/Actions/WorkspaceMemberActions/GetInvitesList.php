<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceInvitationService;

class GetInvitesList
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceInvitationService $workspaceInvitationService
    ) {
    }

    public function execute(): array
    {
        $invitations = WorkspaceInvitation::query()
            ->with([
                'role:id,name,slug',
                'inviter:id,name,email',
            ])
            ->where('workspace_id', $this->workspaceContextService->currentWorkspaceId())
            ->latest('id')
            ->get();

        $normalizedInvitations = $this->workspaceInvitationService->normalizeInvitationStatuses($invitations);

        return $this->workspaceInvitationService->serializeInvitations($normalizedInvitations);
    }
}
