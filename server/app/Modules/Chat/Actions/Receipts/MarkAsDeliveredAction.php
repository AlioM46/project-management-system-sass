<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Receipts;

use App\Modules\Chat\Events\MessageDelivered;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\Message;

final class MarkAsDeliveredAction
{
    public function execute(int $conversationId, int $messageId): void
    {
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);
        $conversation = Conversation::find($conversationId);

        if ($conversation && $message->delivered_at === null) {
            $message->update(['delivered_at' => now()]);
            broadcast(new MessageDelivered($conversation->workspace_id, $conversationId, now()->toIso8601String()))->toOthers();
        }
    }
}
