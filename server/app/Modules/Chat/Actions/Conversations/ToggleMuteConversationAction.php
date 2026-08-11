<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use Carbon\Carbon;

final class ToggleMuteConversationAction
{
    public function execute(int $conversationId, int $userId, ?string $duration): ?Carbon
    {
        $conversation = Conversation::findOrFail($conversationId);

        $participant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($participant->muted_until && $participant->muted_until->isFuture()) {
            $participant->update(['muted_until' => null]);
            return null;
        }

        $mutedUntil = match ($duration) {
            '15m' => now()->addMinutes(15),
            '1h' => now()->addHour(),
            '8h' => now()->addHours(8),
            '24h' => now()->addDay(),
            '1w' => now()->addWeek(),
            'forever' => now()->addYears(100),
            default => now()->addYears(100),
        };

        $participant->update(['muted_until' => $mutedUntil]);

        return $mutedUntil;
    }
}
