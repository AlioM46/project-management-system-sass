<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Events\MessagePinnedStateUpdated;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;

final class TogglePinMessageAction
{
    public function execute(int $conversationId, int $messageId, int $userId): array
    {
        $conversation = Conversation::findOrFail($conversationId);

        if (in_array($conversation->type, ['group', 'project'], true)) {
            $participant = ConversationParticipant::where('conversation_id', $conversationId)
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->whereIn('role', ['owner', 'admin'])
                ->first();

            if (!$participant) {
                throw new \UnauthorizedException('Only group admins and owners can pin or unpin messages.');
            }
        }

        $message = Message::where('conversation_id', $conversationId)
            ->where('id', $messageId)
            ->firstOrFail();

        $unpinnedMessage = null;

        if ($message->is_pinned) {
            $message->update([
                'is_pinned' => false,
                'pinned_at' => null,
            ]);
        } else {
            $existingPinned = Message::where('conversation_id', $conversationId)
                ->where('is_pinned', true)
                ->where('id', '!=', $messageId)
                ->first();

            if ($existingPinned) {
                $existingPinned->update([
                    'is_pinned' => false,
                    'pinned_at' => null,
                ]);
                $unpinnedMessage = $existingPinned;
            }

            $message->update([
                'is_pinned' => true,
                'pinned_at' => now(),
            ]);
        }

        $message->load(['sender:id,name,avatar_url,username', 'attachments']);

        broadcast(new MessagePinnedStateUpdated($message, $unpinnedMessage))->toOthers();

        return [
            'message_id' => $message->id,
            'is_pinned' => $message->is_pinned,
            'pinned_at' => $message->pinned_at?->toISOString(),
            'unpinned_message_id' => $unpinnedMessage?->id,
            'message' => $message->toArray(),
        ];
    }
}
