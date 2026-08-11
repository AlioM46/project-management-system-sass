<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Actions\Conversations\ClearConversationHistoryAction;
use App\Modules\Chat\Actions\Conversations\CreateConversationAction;
use App\Modules\Chat\Actions\Conversations\DeleteConversationAction;
use App\Modules\Chat\Actions\Conversations\GetConversationsListAction;
use App\Modules\Chat\Actions\Conversations\GetConversationSidebarInfoAction;
use App\Modules\Chat\Actions\Conversations\ToggleMuteConversationAction;
use App\Modules\Chat\Actions\Conversations\TogglePinConversationAction;
use App\Modules\Chat\Actions\Conversations\UpdateConversationDetailsAction;
use App\Modules\Chat\Actions\Messages\DeleteMessageForAllAction;
use App\Modules\Chat\Actions\Messages\DeleteMessageForMeAction;
use App\Modules\Chat\Actions\Messages\EditMessageAction;
use App\Modules\Chat\Actions\Messages\GetPaginatedMessagesAction;
use App\Modules\Chat\Actions\Messages\GetPinnedMessageAction;
use App\Modules\Chat\Actions\Messages\GetStarredMessagesAction;
use App\Modules\Chat\Actions\Messages\SearchMessagesAction;
use App\Modules\Chat\Actions\Messages\SendMessageAction;
use App\Modules\Chat\Actions\Messages\ToggleMessageReactionAction;
use App\Modules\Chat\Actions\Messages\TogglePinMessageAction;
use App\Modules\Chat\Actions\Messages\ToggleStarMessageAction;
use App\Modules\Chat\Actions\Receipts\MarkAllDeliveredOnPresenceJoinAction;
use App\Modules\Chat\Actions\Receipts\MarkAsDeliveredAction;
use App\Modules\Chat\Actions\Receipts\MarkConversationAsReadAction;
use App\Modules\Chat\Http\Requests\CreateConversationRequest;
use App\Modules\Chat\Http\Requests\EditMessageRequest;
use App\Modules\Chat\Http\Requests\SendMessageRequest;
use App\Modules\Chat\Http\Requests\UpdateConversationDetailsRequest;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ConversationController extends Controller
{
    public function __construct(
        private WorkspaceContextService $workspaceContextService,
    ) {}

    public function index(GetConversationsListAction $action): JsonResponse
    {
        $conversations = $action->execute(auth()->id());
        return ApiResponse::success('Conversations retrieved successfully.', $conversations->toArray());
    }

    public function store(CreateConversationRequest $request, CreateConversationAction $action): JsonResponse
    {
        try {
            $conversation = $action->execute(
                type: $request->type,
                userIds: $request->user_ids,
                name: $request->name,
                currentUserId: auth()->id()
            );

            return ApiResponse::success('Conversation created successfully.', $conversation->toArray(), [], 201);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'INVALID_PARTICIPANT', [], 400);
        }
    }

    public function getMessages(int $id, Request $request, GetPaginatedMessagesAction $action): JsonResponse
    {
        try {
            $result = $action->execute(
                conversationId: $id,
                userId: auth()->id(),
                aroundMessageId: $request->query('around_message_id') ? (int) $request->query('around_message_id') : null,
                afterMessageId: $request->query('after_message_id') ? (int) $request->query('after_message_id') : null,
                beforeMessageId: $request->query('before_message_id') ? (int) $request->query('before_message_id') : null,
            );

            return ApiResponse::success('Messages retrieved successfully.', $result);
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'MESSAGE_NOT_FOUND', [], 404);
        }
    }

    public function sendMessage(SendMessageRequest $request, int $id, SendMessageAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $message = $action->execute(
                conversationId: $id,
                userId: auth()->id(),
                workspaceId: $workspaceId,
                body: $request->body,
                replyId: $request->message_id ? (int) $request->message_id : null,
                attachments: $request->file('attachments') ?? []
            );

            return ApiResponse::success('Message sent successfully.', $message->toArray(), [], 201);
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'MESSAGE_CANNOT_BE_SENT', [], 400);
        }
    }

    public function markAsDelivered(int $conversationId, int $messageId, MarkAsDeliveredAction $action): JsonResponse
    {
        $action->execute($conversationId, $messageId);
        return response()->json(['status' => 'ok']);
    }

    public function markAllDeliveredOnPresenceJoin(MarkAllDeliveredOnPresenceJoinAction $action): JsonResponse
    {
        $action->execute(auth()->id());
        return response()->json(['status' => 'ok']);
    }

    public function markAsRead(int $conversationId, MarkConversationAsReadAction $action): JsonResponse
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $action->execute($conversationId, auth()->id(), $workspaceId);
        return response()->json(['status' => 'ok']);
    }

    public function deleteForMe(int $conversationId, int $messageId, DeleteMessageForMeAction $action): JsonResponse
    {
        try {
            $deletion = $action->execute($conversationId, $messageId, auth()->id());
            return ApiResponse::success('Message deleted successfully.', $deletion->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        }
    }

    public function deleteForAll(int $conversationId, int $messageId, DeleteMessageForAllAction $action): JsonResponse
    {
        try {
            $message = $action->execute($conversationId, $messageId, auth()->id());
            return ApiResponse::success('Message deleted successfully.', $message->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'MESSAGE_CANNOT_BE_DELETED', [], 403);
        }
    }

    public function update(EditMessageRequest $request, int $conversationId, int $messageId, EditMessageAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $message = $action->execute($conversationId, $messageId, auth()->id(), $request->body, $workspaceId);
            return ApiResponse::success('Message updated successfully.', $message->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'MESSAGE_CANNOT_BE_UPDATED', [], 403);
        }
    }

    public function toggleReaction(Request $request, int $id, int $messageId, ToggleMessageReactionAction $action): JsonResponse
    {
        $request->validate([
            'emoji' => 'required|string|max:32',
        ]);

        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $reactions = $action->execute($id, $messageId, auth()->id(), $request->emoji, $workspaceId);
            return ApiResponse::success('Reaction updated successfully.', $reactions);
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        }
    }

    public function toggleStarMessage(int $id, int $messageId, ToggleStarMessageAction $action): JsonResponse
    {
        $isStarred = $action->execute($id, $messageId, auth()->id());
        return ApiResponse::success($isStarred ? 'Message starred.' : 'Message unstarred.', ['is_starred' => $isStarred]);
    }

    public function togglePinMessage(int $id, int $messageId, TogglePinMessageAction $action): JsonResponse
    {
        try {
            $result = $action->execute($id, $messageId, auth()->id());
            return ApiResponse::success(
                $result['is_pinned'] ? 'Message pinned successfully.' : 'Message unpinned successfully.',
                $result
            );
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'FORBIDDEN', [], 403);
        }
    }

    public function getPinnedMessage(int $id, GetPinnedMessageAction $action): JsonResponse
    {
        $pinned = $action->execute($id);
        return ApiResponse::success('Pinned message retrieved successfully.', [
            'pinned_message' => $pinned ? $pinned->toArray() : null,
        ]);
    }

    public function searchMessages(int $id, Request $request, SearchMessagesAction $action): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:1|max:100',
        ]);

        try {
            $messages = $action->execute($id, auth()->id(), $request->query('q'));
            return ApiResponse::success('Messages retrieved successfully.', $messages->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        }
    }

    public function getStarredMessages(int $id, GetStarredMessagesAction $action): JsonResponse
    {
        try {
            $messages = $action->execute($id, auth()->id());
            return ApiResponse::success('Starred messages retrieved successfully.', $messages->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        }
    }

    public function sidebarInfo(int $id, GetConversationSidebarInfoAction $action): JsonResponse
    {
        try {
            $workspaceId = $this->workspaceContextService->currentWorkspaceId();
            $info = $action->execute($id, auth()->id(), $workspaceId);
            return ApiResponse::success('Sidebar info retrieved successfully.', $info);
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'UNAUTHORIZED_ACCESS', [], 403);
        }
    }

    public function updateDetails(UpdateConversationDetailsRequest $request, int $id, UpdateConversationDetailsAction $action): JsonResponse
    {
        try {
            $conversation = $action->execute($id, auth()->id(), $request->name, $request->description);
            return ApiResponse::success('Group details updated successfully.', $conversation->toArray());
        } catch (\UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), 'FORBIDDEN', [], 403);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 'INVALID_CONVERSATION_TYPE', [], 400);
        }
    }

    public function togglePinConversation(int $id, TogglePinConversationAction $action): JsonResponse
    {
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();
        $isPinned = $action->execute($id, auth()->id(), $workspaceId);

        return ApiResponse::success(
            $isPinned ? 'Conversation pinned successfully.' : 'Conversation unpinned successfully.',
            ['is_pinned' => $isPinned]
        );
    }
}
