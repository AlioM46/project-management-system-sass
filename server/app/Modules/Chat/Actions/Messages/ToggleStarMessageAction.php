<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\StarredMessage;

final class ToggleStarMessageAction
{
    public function execute(int $conversationId, int $messageId, int $userId): bool
    {
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        $starred = StarredMessage::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->first();

        if ($starred) {
            $starred->delete();
            return false;
        }

        StarredMessage::create([
            'message_id' => $message->id,
            'user_id' => $userId,
        ]);

        return true;
    }
}
