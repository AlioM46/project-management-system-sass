<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceMembersService;
use Illuminate\Support\Facades\DB;

class LeaveCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService
    ) {
    }

    public function execute(User $user, array $data): array
    {
        $currentWorkspace = $this->workspaceContextService->currentWorkspace();
        $currentMembership = $this->workspaceContextService->currentMembership();

        if ($currentWorkspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if ($currentMembership === null) {
            throw WorkspaceContextException::notAMember($currentWorkspace->id);
        }

        return DB::transaction(function () use ($currentWorkspace, $currentMembership, $user, $data) {
            if (!$currentWorkspace->isManagedBy($user->id)) {
                $this->workspaceMembersService->removeMembership($currentMembership);

                return [
                    'action' => 'left',
                    'workspace' => [
                        'id' => $currentWorkspace->id,
                    ],
                ];
            }

            // NOW: the user is Owner
            // count members with out the current user
            $otherMembersCount = $this->workspaceMembersService->countOtherMembers(
                $currentWorkspace,
                $currentMembership->id
            );

            if ($otherMembersCount === 0) {
                $currentWorkspace->delete();

                return [
                    'action' => 'archived',
                    'workspace' => [
                        'id' => $currentWorkspace->id,
                        'deleted_at' => $currentWorkspace->deleted_at,
                    ],
                ];
            }

            $successorMemberId = $data['successor_member_id'] ?? null;
            $selectionMode = $successorMemberId !== null ? 'explicit' : 'automatic';

            $successorMembership = $this->workspaceMembersService->resolveSuccessorForOwnerLeave(
                $currentWorkspace,
                $currentMembership->id,
                $successorMemberId
            );

            $this->workspaceMembersService->assignOwnerToMembership($currentWorkspace, $successorMembership);
            $this->workspaceMembersService->removeMembership($currentMembership);

            $currentWorkspace->refresh();
            $currentWorkspace->load([
                'owner:id,name,email',
            ])->loadCount('members');

            return [
                'action' => 'transferred_and_left',
                'selection_mode' => $selectionMode,
                'successor_member_id' => $successorMembership->id,
                'workspace' => $currentWorkspace,
            ];
        });
    }
}
