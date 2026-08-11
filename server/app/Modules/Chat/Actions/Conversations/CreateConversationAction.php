<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;

final class CreateConversationAction
{
    public function execute(string $type, array $userIds, ?string $name, int $currentUserId): Conversation
    {
        if ($type === 'direct') {
            $targetUserId = (int) $userIds[0];

            if ($targetUserId === $currentUserId) {
                throw new \InvalidArgumentException('Cannot start a DM with yourself.');
            }

            $existing = Conversation::where('type', 'direct')
                ->whereHas('participants', function ($q) use ($currentUserId) {
                    $q->where('user_id', $currentUserId);
                })
                ->whereHas('participants', function ($q) use ($targetUserId) {
                    $q->where('user_id', $targetUserId);
                })
                ->first();

            if ($existing) {
                $participant = $existing->participants()->where('user_id', $currentUserId)->first();
                if ($participant && !$participant->is_active) {
                    $participant->update(['is_active' => true, 'joined_at' => now()]);
                }
                return $existing->load('participants.user:id,name,avatar_url');
            }
        }

        $conversation = Conversation::create([
            'type' => $type,
            'name' => $type === 'group' ? $name : null,
        ]);

        $participantIds = array_unique(array_merge($userIds, [$currentUserId]));
        foreach ($participantIds as $uid) {
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $uid,
                'role' => (int) $uid === $currentUserId && $type === 'group' ? 'owner' : 'member',
            ]);
        }

        return $conversation->load('participants.user:id,name,avatar_url');
    }
}
