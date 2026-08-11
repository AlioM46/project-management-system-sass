<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Actions\Conversations\ClearConversationHistoryAction;
use App\Modules\Chat\Actions\Conversations\DeleteConversationAction;
use App\Modules\Chat\Actions\Conversations\ToggleMuteConversationAction;
use App\Modules\Chat\Actions\Participants\AddParticipantsAction;
use App\Modules\Chat\Actions\Participants\ChangeParticipantRoleAction;
use App\Modules\Chat\Actions\Participants\RemoveParticipantAction;
use App\Modules\Chat\Http\Requests\AddParticipantsRequest;
use App\Modules\Chat\Http\Requests\ChangeParticipantRoleRequest;
use App\Modules\Chat\Http\Requests\ToggleMuteRequest;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

final class ParticipantsController extends Controller
{
    public function __construct(
        private WorkspaceContextService $workspaceContextService,
    ) {}

    public function AddParticipants(int $id, AddParticipantsRequest $request, AddParticipantsAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $action->execute($id, $request->user_ids, $workspaceId, auth()->id());
            return ApiResponse::success('Participants added successfully.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'INVALID_TYPE', [], 400);
        }
    }

    public function RemoveParticipants(int $id, int $userId, RemoveParticipantAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $action->execute($id, $userId, $workspaceId, auth()->id());
            return ApiResponse::success('Participant removed successfully.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'INVALID_REQUEST', [], 400);
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'FORBIDDEN', [], 403);
        }
    }

    public function ChangeParticipantRole(int $id, int $participantId, ChangeParticipantRoleRequest $request, ChangeParticipantRoleAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $participant = $action->execute($id, $participantId, $request->role, $workspaceId, auth()->id());
            return ApiResponse::success('Participant role updated successfully.', $participant->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'FORBIDDEN', [], 403);
        }
    }

    public function ClearConversation(int $id, ClearConversationHistoryAction $action): JsonResponse
    {
        $action->execute($id, auth()->id());
        return ApiResponse::success('Conversation cleared successfully.');
    }

    public function DeleteConversation(int $id, DeleteConversationAction $action): JsonResponse
    {
        $action->execute($id, auth()->id());
        return ApiResponse::success('Conversation deleted successfully.');
    }

    public function ToggleMute(int $id, ToggleMuteRequest $request, ToggleMuteConversationAction $action): JsonResponse
    {
        $mutedUntil = $action->execute($id, auth()->id(), $request->duration);
        $isMuted = $mutedUntil !== null;

        return ApiResponse::success(
            $isMuted ? 'Conversation muted.' : 'Conversation unmuted.',
            [
                'is_muted' => $isMuted,
                'muted_until' => $mutedUntil ? $mutedUntil->toIso8601String() : null,
            ]
        );
    }
}
