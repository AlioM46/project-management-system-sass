<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceInvitationService;
use Illuminate\Support\Facades\DB;

class AcceptWorkspaceInvite
{
    public function __construct(
        private readonly WorkspaceInvitationService $workspaceInvitationService
    ) {}

    public function execute(User $user, array $data): array
    {
        $invitationId = (int) $data['invitation_id'];
        $plainToken = (string) $data['token'];

        return DB::transaction(function () use ($user, $invitationId, $plainToken) {
            $invitation = WorkspaceInvitation::query()
                ->whereKey($invitationId)
                ->lockForUpdate()
                ->first();

            if ($invitation === null) {
                throw WorkspaceContextException::invalidInvitationToken();
            }

            if ($invitation->status !== 'pending') {
                throw WorkspaceContextException::invitationAlreadyHandled(
                    invitationId: $invitation->id,
                    status: (string) $invitation->status
                );
            }

            if ($this->workspaceInvitationService->isExpired($invitation)) {
                $invitation->status = 'expired';
                $invitation->save();

                throw WorkspaceContextException::invitationExpired($invitation->id, $invitation->workspace_id);
            }

            if (! $this->workspaceInvitationService->tokenMatches($invitation, $plainToken)) {
                throw WorkspaceContextException::invalidInvitationToken();
            }

            $invitedEmail = $this->workspaceInvitationService->normalizeEmail((string) $invitation->email);
            $currentUserEmail = $this->workspaceInvitationService->normalizeEmail((string) $user->email);

            if ($invitedEmail !== $currentUserEmail) {
                throw WorkspaceContextException::invitationEmailMismatch($invitation->id);
            }

            $member = Workspace_Members::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->firstOrCreate(
                    [
                        'workspace_id' => $invitation->workspace_id,
                        'user_id' => $user->id,
                    ],
                    [
                        'role_id' => $invitation->role_id,
                        'joined_at' => now(),
                    ]
                );

            $invitation->status = 'accepted';
            $invitation->accepted_by_user_id = $user->id;
            $invitation->accepted_at = now();
            $invitation->save();

            return [
                'action' => 'accepted',
                'workspace_id' => $invitation->workspace_id,
                'member_id' => $member->id,
                'invitation_id' => $invitation->id,
                'status' => $invitation->status,
            ];
        });
    }
}
