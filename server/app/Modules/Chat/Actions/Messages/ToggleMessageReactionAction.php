<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Events\MessageReactionUpdated;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageReaction;

final class ToggleMessageReactionAction
{
    public function execute(int $conversationId, int $messageId, int $userId, string $emoji, int $workspaceId): array
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                throw new \UnauthorizedException('Unauthorized.');
            }
        }

        $message = Message::where('conversation_id', $conversation->id)->findOrFail($messageId);

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                $existing->delete();
            } else {
                $existing->update(['emoji' => $emoji]);
            }
        } else {
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $userId,
                'emoji' => $emoji,
            ]);
        }

        $reactions = MessageReaction::where('message_id', $message->id)
            ->with('user:id,name')
            ->get()
            ->toArray();

        broadcast(new MessageReactionUpdated($workspaceId, $conversation->id, $message->id, $reactions))->toOthers();

        return $reactions;
    }
}
