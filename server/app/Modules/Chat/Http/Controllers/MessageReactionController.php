<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageReaction;
use App\Modules\Chat\Model\StarredMessage;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageReactionController extends Controller
{
    private WorkspaceContextService $workspaceContextService;

    public function __construct(WorkspaceContextService $workspaceContextService)
    {
        $this->workspaceContextService = $workspaceContextService;
    }

    /**
     * Toggle emoji reaction on a message.
     */
    public function toggleReaction(Request $request, int $id, int $messageId): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string',
        ]);

        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        $existing = MessageReaction::where('message_id', $messageId)
            ->where('user_id', $userId)
            ->where('emoji', $request->emoji)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            MessageReaction::create([
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $request->emoji,
            ]);
        }

        $reactions = MessageReaction::where('message_id', $messageId)
            ->with('user:id,name')
            ->get();

        return ApiResponse::success('Reaction toggled successfully.', $reactions->toArray());
    }

    /**
     * Toggle star state on a message for current user.
     */
    public function toggleStarMessage(int $id, int $messageId): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        $existing = StarredMessage::where('message_id', $messageId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            $existing->delete();
            $isStarred = false;
        } else {
            StarredMessage::create([
                'message_id' => $messageId,
                'user_id' => $userId,
            ]);
            $isStarred = true;
        }

        return ApiResponse::success('Star toggled successfully.', [
            'is_starred' => $isStarred,
            'message_id' => $messageId,
        ]);
    }

    /**
     * Get list of starred messages in a conversation for current user.
     */
    public function getStarredMessages(int $id): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        $starredMessages = Message::where('conversation_id', $id)
            ->whereHas('starredByUsers', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['user:id,name,email,avatar_url', 'attachments'])
            ->latest()
            ->get();

        return ApiResponse::success('Starred messages retrieved successfully.', $starredMessages->toArray());
    }
}
