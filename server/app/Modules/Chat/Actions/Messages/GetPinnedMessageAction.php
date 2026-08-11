<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Model\Message;

final class GetPinnedMessageAction
{
    public function execute(int $conversationId): ?Message
    {
        return Message::where('conversation_id', $conversationId)
            ->where('is_pinned', true)
            ->with(['sender:id,name,avatar_url,username', 'attachments'])
            ->first();
    }
}
