<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\PinnedConversation;

final class TogglePinConversationAction
{
    public function execute(int $conversationId, int $userId, int $workspaceId): bool
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->findOrFail($conversationId);

        $pinned = PinnedConversation::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->first();

        if ($pinned) {
            $pinned->delete();
            return false;
        }

        PinnedConversation::create([
            'workspace_id' => $workspaceId,
            'conversation_id' => $conversationId,
            'user_id' => $userId,
        ]);

        return true;
    }
}
