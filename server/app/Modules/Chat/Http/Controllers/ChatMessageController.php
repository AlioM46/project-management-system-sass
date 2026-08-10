<?php

namespace App\Modules\Chat\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Chat\Events\MessageDeleted;
use App\Modules\Chat\Events\MessageSent;
use App\Modules\Chat\Events\MessageUpdated;
use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageAttachment;
use App\Modules\Chat\Model\MessageDeletion;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChatMessageController extends Controller
{
    private WorkspaceContextService $workspaceContextService;

    public function __construct(WorkspaceContextService $workspaceContextService)
    {
        $this->workspaceContextService = $workspaceContextService;
    }

    /**
     * Get paginated messages for a conversation with smart anchor support.
     */
    public function getMessages(Request $request, int $id): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        $limit = (int) $request->get('limit', 30);
        $aroundMessageId = $request->get('around_message_id');
        $beforeMessageId = $request->get('before_message_id');
        $afterMessageId = $request->get('after_message_id');

        $baseQuery = Message::where('conversation_id', $conversation->id)
            ->whereDoesntHave('deletions', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['user:id,name,email,avatar_url', 'attachments', 'reactions.user:id,name'])
            ->withExists(['starredByUsers as is_starred' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);

        if ($aroundMessageId) {
            $targetMessage = (clone $baseQuery)->find($aroundMessageId);
            if ($targetMessage) {
                $olderMessages = (clone $baseQuery)
                    ->where('created_at', '<', $targetMessage->created_at)
                    ->latest()
                    ->take(15)
                    ->get()
                    ->reverse();

                $newerMessages = (clone $baseQuery)
                    ->where('created_at', '>', $targetMessage->created_at)
                    ->oldest()
                    ->take(15)
                    ->get();

                $messages = $olderMessages->concat([$targetMessage])->concat($newerMessages);

                $oldestId = $messages->first()?->id;
                $newestId = $messages->last()?->id;

                $hasBefore = $oldestId ? (clone $baseQuery)->where('created_at', '<', $messages->first()->created_at)->exists() : false;
                $hasAfter = $newestId ? (clone $baseQuery)->where('created_at', '>', $messages->last()->created_at)->exists() : false;

                return ApiResponse::success('Messages around target retrieved successfully.', $messages->values(), [
                    'has_before' => $hasBefore,
                    'has_after' => $hasAfter,
                    'target_message_id' => (int) $aroundMessageId,
                ]);
            }
        }

        if ($beforeMessageId) {
            $pivotMessage = (clone $baseQuery)->find($beforeMessageId);
            if ($pivotMessage) {
                $messages = (clone $baseQuery)
                    ->where('created_at', '<', $pivotMessage->created_at)
                    ->latest()
                    ->take($limit)
                    ->get()
                    ->reverse();

                $oldestId = $messages->first()?->id;
                $hasBefore = $oldestId ? (clone $baseQuery)->where('created_at', '<', $messages->first()->created_at)->exists() : false;

                return ApiResponse::success('Older messages retrieved successfully.', $messages->values(), [
                    'has_before' => $hasBefore,
                    'has_after' => true,
                ]);
            }
        }

        if ($afterMessageId) {
            $pivotMessage = (clone $baseQuery)->find($afterMessageId);
            if ($pivotMessage) {
                $messages = (clone $baseQuery)
                    ->where('created_at', '>', $pivotMessage->created_at)
                    ->oldest()
                    ->take($limit)
                    ->get();

                $newestId = $messages->last()?->id;
                $hasAfter = $newestId ? (clone $baseQuery)->where('created_at', '>', $messages->last()->created_at)->exists() : false;

                return ApiResponse::success('Newer messages retrieved successfully.', $messages->values(), [
                    'has_before' => true,
                    'has_after' => $hasAfter,
                ]);
            }
        }

        $paginator = (clone $baseQuery)->latest()->paginate($limit);
        $reversedMessages = collect($paginator->items())->reverse()->values();

        return ApiResponse::success('Messages retrieved successfully.', $reversedMessages, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'has_before' => $paginator->currentPage() < $paginator->lastPage(),
            'has_after' => false,
        ]);
    }

    /**
     * Send a message with block guard checks and optional attachments.
     */
    public function sendMessage(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'body' => 'nullable|string',
            'message_id' => 'nullable|integer|exists:messages,id',
            'attachments.*' => 'nullable|file|max:51200',
        ]);

        if (empty($request->body) && !$request->hasFile('attachments')) {
            return ApiResponse::error('Message must contain either text body or attachments.', 'EMPTY_MESSAGE', [], 422);
        }

        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        if ($conversation->type === 'direct') {
            $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId)
                ->where('is_active', true)
                ->first();

            $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

            if ($partnerId) {
                $isBlocked = BlockedUser::where('workspace_id', $workspaceId)
                    ->where(function ($query) use ($partnerId, $userId) {
                        $query->where(function ($q1) use ($partnerId, $userId) {
                            $q1->where('blocked_id', $partnerId)->where('blocker_id', $userId);
                        })->orWhere(function ($q2) use ($partnerId, $userId) {
                            $q2->where('blocked_id', $userId)->where('blocker_id', $partnerId);
                        });
                    })
                    ->exists();

                if ($isBlocked) {
                    return ApiResponse::error('Communication is blocked between users.', 'USER_BLOCKED', [], 403);
                }
            }
        }

        $message = DB::transaction(function () use ($request, $conversation, $userId, $workspaceId) {
            $msg = Message::create([
                'workspace_id' => $workspaceId,
                'conversation_id' => $conversation->id,
                'user_id' => $userId,
                'message_id' => $request->message_id,
                'body' => $request->body ?? '',
            ]);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store("workspaces/{$workspaceId}/conversations/{$conversation->id}", 's3');

                    MessageAttachment::create([
                        'message_id' => $msg->id,
                        'object_key' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getClientMimeType() ?: $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            return $msg;
        });

        $message->load(['user:id,name,email,avatar_url', 'attachments', 'reactions.user:id,name']);
        $message->is_starred = false;

        broadcast(new MessageSent($message))->toOthers();

        return ApiResponse::success('Message sent successfully.', $message->toArray(), [], 201);
    }

    /**
     * Search messages inside a conversation by query keyword.
     */
    public function searchMessages(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:1',
        ]);

        $userId = auth()->id();
        $workspaceId = $this->workspaceContextService->currentWorkspaceId();

        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->whereHas('participants', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('is_active', true);
            })
            ->findOrFail($id);

        $query = $request->get('query');

        $messages = Message::where('conversation_id', $conversation->id)
            ->where('body', 'LIKE', "%{$query}%")
            ->whereDoesntHave('deletions', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['user:id,name,email,avatar_url', 'attachments'])
            ->latest()
            ->paginate(20);

        return ApiResponse::success('Search results retrieved successfully.', $messages->items(), [
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'total' => $messages->total(),
        ]);
    }

    /**
     * Update message content (only sender).
     */
    public function update(Request $request, int $id, int $messageId): JsonResponse
    {
        $request->validate([
            'body' => 'required|string',
        ]);

        $userId = auth()->id();
        $message = Message::where('conversation_id', $id)
            ->where('user_id', $userId)
            ->findOrFail($messageId);

        $message->update([
            'body' => $request->body,
        ]);

        $message->load(['user:id,name,email,avatar_url', 'attachments', 'reactions.user:id,name']);

        broadcast(new MessageUpdated($message))->toOthers();

        return ApiResponse::success('Message updated successfully.', $message->toArray());
    }

    /**
     * Soft delete message for current user only.
     */
    public function deleteForMe(int $id, int $messageId): JsonResponse
    {
        $userId = auth()->id();

        MessageDeletion::firstOrCreate([
            'message_id' => $messageId,
            'user_id' => $userId,
        ]);

        return ApiResponse::success('Message hidden for you successfully.');
    }

    /**
     * Delete message for all participants (only sender).
     */
    public function deleteForAll(int $id, int $messageId): JsonResponse
    {
        $userId = auth()->id();
        $message = Message::where('conversation_id', $id)
            ->where('user_id', $userId)
            ->findOrFail($messageId);

        foreach ($message->attachments as $attachment) {
            Storage::disk('s3')->delete($attachment->object_key);
        }

        $message->delete();

        broadcast(new MessageDeleted($id, $messageId))->toOthers();

        return ApiResponse::success('Message deleted for everyone successfully.');
    }
}
