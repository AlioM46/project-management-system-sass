<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use Illuminate\Support\Collection;

final class GetStarredMessagesAction
{
    public function execute(int $conversationId, int $userId): Collection
    {
        $conversation = Conversation::findOrFail($conversationId);

        $participant = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if ($conversation->type !== 'project' && !$participant) {
            throw new \UnauthorizedException('Unauthorized.');
        }

        return Message::where('conversation_id', $conversationId)
            ->visibleToParticipant($participant)
            ->whereHas('starredByUsers', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['sender:id,name,avatar_url', 'parent.sender:id,name', 'reactions.user:id,name', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($msg) {
                $msg->is_starred = true;
                return $msg;
            });
    }
}
