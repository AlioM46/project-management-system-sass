<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Actions\Block\BlockUserAction;
use App\Modules\Chat\Actions\Block\GetBlockedUsersAction;
use App\Modules\Chat\Actions\Block\UnblockUserAction;
use App\Modules\Chat\Http\Requests\BlockUserRequest;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

final class BlockController extends Controller
{
    public function __construct(
        private WorkspaceContextService $workspaceContextService,
    ) {}

    public function blockUser(BlockUserRequest $request, BlockUserAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $targetUserId = $request->getBlockedUserId();
            $action->execute(auth()->id(), $targetUserId, $workspaceId);

            return ApiResponse::success('User blocked successfully.', [
                'is_blocked' => true,
                'blocked_user_id' => $targetUserId,
            ]);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'CANNOT_BLOCK_SELF', [], 422);
        }
    }

    public function unblockUser(int $userId, UnblockUserAction $action): JsonResponse
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $action->execute(auth()->id(), $userId, $workspaceId);

        return ApiResponse::success('User unblocked successfully.', [
            'is_blocked' => false,
            'unblocked_user_id' => $userId,
        ]);
    }

    public function getBlockedUsers(GetBlockedUsersAction $action): JsonResponse
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $blockedUsers = $action->execute(auth()->id(), $workspaceId);

        return ApiResponse::success('Blocked users retrieved successfully.', $blockedUsers->toArray());
    }
}
