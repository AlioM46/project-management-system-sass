<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;

final class UpdateConversationDetailsAction
{
    public function execute(int $conversationId, int $userId, ?string $name, ?string $description): Conversation
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'group') {
            throw new \InvalidArgumentException('Only group conversation details can be updated.');
        }

        $myParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if (!$myParticipant || !in_array($myParticipant->role, ['owner', 'admin'], true)) {
            throw new \UnauthorizedException('Only group admins or owners can update group details.');
        }

        $conversation->update(array_filter([
            'name' => $name,
            'description' => $description,
        ], fn($val) => $val !== null));

        return $conversation;
    }
}
