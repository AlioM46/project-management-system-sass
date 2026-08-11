<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageDeletion;

final class DeleteMessageForMeAction
{
    public function execute(int $conversationId, int $messageId, int $userId): MessageDeletion
    {
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant) {
            throw new \UnauthorizedException('You are not authorized to delete this message.');
        }

        return MessageDeletion::create([
            'message_id' => $messageId,
            'user_id' => $userId,
        ]);
    }
}
