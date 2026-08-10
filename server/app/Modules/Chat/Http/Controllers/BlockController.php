<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    private WorkspaceContextService $workspaceContextService;

    public function __construct(WorkspaceContextService $workspaceContextService)
    {
        $this->workspaceContextService = $workspaceContextService;
    }

    /**
     * Block a target user in the current workspace.
     */
    public function blockUser(Request $request): JsonResponse
    {

        $request->validate([
            'blocked_user_id' => 'required|integer|exists:users,id',
        ]);

        $currentUserId = auth()->id();
        $blockedUserId = (int) $request->blocked_user_id;

        if ($currentUserId === $blockedUserId) {
            return ApiResponse::error('You cannot block yourself.', 'CANNOT_BLOCK_SELF', [], 422);
        }

        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $alreadyBlocked = BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $currentUserId)
            ->where('blocked_id', $blockedUserId)
            ->exists();

        if (!$alreadyBlocked) {
            BlockedUser::create([
                'workspace_id' => $workspaceId,
                'blocker_id' => $currentUserId,
                'blocked_id' => $blockedUserId,
            ]);
        }

        return ApiResponse::success('User blocked successfully.', [
            'is_blocked' => true,
            'blocked_user_id' => $blockedUserId,
        ]);
    }

    /**
     * Unblock a target user in the current workspace.
     */
    public function unblockUser(int $userId): JsonResponse
    {
        $currentUserId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $currentUserId)
            ->where('blocked_id', $userId)
            ->delete();

        return ApiResponse::success('User unblocked successfully.', [
            'is_blocked' => false,
            'unblocked_user_id' => $userId,
        ]);
    }

    /**
     * Get list of blocked users in active workspace.
     */
    public function getBlockedUsers(): JsonResponse
    {
        $currentUserId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $blockedUsers = BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $currentUserId)
            ->with('blocked:id,name,email,avatar_url,username')
            ->get()
            ->pluck('blocked');

        return ApiResponse::success('Blocked users retrieved successfully.', $blockedUsers->toArray());
    }
}
