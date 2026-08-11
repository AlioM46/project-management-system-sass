<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Receipts;

use App\Modules\Chat\Events\MessageRead;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\ConversationReadState;
use App\Modules\Chat\Model\Message;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Model\Notification;

final class MarkConversationAsReadAction
{
    public function execute(int $conversationId, int $userId, int $workspaceId): void
    {
        ConversationReadState::updateOrCreate(
            ['user_id' => $userId, 'conversation_id' => $conversationId],
            ['read_at' => now()]
        );

        Notification::query()
            ->where('user_id', $userId)
            ->where('type', NotificationType::CHAT_MESSAGE)
            ->where('data->conversationId', $conversationId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $latestMessage = Message::where('conversation_id', $conversationId)
            ->where('user_id', '!=', $userId)
            ->latest()
            ->first();

        if ($latestMessage) {
            $otherParticipantsCount = ConversationParticipant::where('conversation_id', $conversationId)
                ->where('user_id', '!=', $latestMessage->user_id)
                ->where('is_active', true)
                ->count();

            if ($otherParticipantsCount > 0) {
                $readStatesCount = ConversationReadState::where('conversation_id', $conversationId)
                    ->where('user_id', '!=', $latestMessage->user_id)
                    ->where('read_at', '>=', $latestMessage->created_at)
                    ->count();

                if ($readStatesCount >= $otherParticipantsCount) {
                    broadcast(new MessageRead($workspaceId, $conversationId, $userId, now()->toIso8601String()))->toOthers();
                }
            }
        }
    }
}
