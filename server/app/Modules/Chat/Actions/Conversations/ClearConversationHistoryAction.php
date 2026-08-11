<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;

final class ClearConversationHistoryAction
{
    public function execute(int $conversationId, int $userId): void
    {
        $conversation = Conversation::findOrFail($conversationId);

        $participant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $participant->update([
            'cleared_at' => now(),
        ]);
    }
}
