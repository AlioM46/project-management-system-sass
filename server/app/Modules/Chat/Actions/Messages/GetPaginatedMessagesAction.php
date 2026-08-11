<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;

final class GetPaginatedMessagesAction
{
    public function execute(
        int $conversationId,
        int $userId,
        ?int $aroundMessageId = null,
        ?int $afterMessageId = null,
        ?int $beforeMessageId = null,
    ): array {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                throw new \UnauthorizedException('Unauthorized.');
            }
        }

        $participant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if ($aroundMessageId) {
            $anchorMessage = Message::where('conversation_id', $conversationId)
                ->visibleToParticipant($participant)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->where('id', $aroundMessageId)
                ->first();

            if (!$anchorMessage) {
                throw new \InvalidArgumentException('Message not found.');
            }

            $beforeMessages = Message::where('conversation_id', $conversationId)
                ->visibleToParticipant($participant)
                ->where('created_at', '<', $anchorMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('created_at', 'desc')
                ->limit(15)
                ->get()
                ->reverse();

            $afterMessages = Message::where('conversation_id', $conversationId)
                ->visibleToParticipant($participant)
                ->where('created_at', '>', $anchorMessage->created_at)
                ->withExists([
                    'starredByUsers as is_starred' => function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }
                ])
                ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
                ->orderBy('created_at', 'asc')
                ->limit(15)
                ->get();

            $anchorMessage->load(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments']);

            $combinedMessages = $beforeMessages->concat([$anchorMessage])->concat($afterMessages);

            $hasBefore = Message::where('conversation_id', $conversationId)
                ->visibleToParticipant($participant)
                ->where('created_at', '<', $beforeMessages->first()?->created_at ?? $anchorMessage->created_at)
                ->exists();

            $hasAfter = Message::where('conversation_id', $conversationId)
                ->visibleToParticipant($participant)
                ->where('created_at', '>', $afterMessages->last()?->created_at ?? $anchorMessage->created_at)
                ->exists();

            return [
                'data' => $combinedMessages->values(),
                'has_before' => $hasBefore,
                'has_after' => $hasAfter,
            ];
        }

        $query = Message::where('conversation_id', $conversationId)
            ->visibleToParticipant($participant)
            ->withExists([
                'starredByUsers as is_starred' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }
            ])
            ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments']);

        if ($beforeMessageId) {
            $beforeMsg = Message::find($beforeMessageId);
            if ($beforeMsg) {
                $query->where('created_at', '<', $beforeMsg->created_at);
            }
        }

        if ($afterMessageId) {
            $afterMsg = Message::find($afterMessageId);
            if ($afterMsg) {
                $query->where('created_at', '>', $afterMsg->created_at);
            }
        }

        $messages = $query->orderBy('created_at', 'desc')->paginate(30);

        return [
            'data' => collect($messages->items())->reverse()->values(),
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'per_page' => $messages->perPage(),
            'total' => $messages->total(),
            'has_before' => $messages->hasMorePages(),
        ];
    }
}
