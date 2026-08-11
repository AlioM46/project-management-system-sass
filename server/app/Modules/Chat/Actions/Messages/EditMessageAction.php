<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Events\MessageUpdated;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Comments\Services\MentionService;

final class EditMessageAction
{
    public function __construct(
        private MentionService $mentionService,
    ) {}

    public function execute(int $conversationId, int $messageId, int $userId, string $body, int $workspaceId): Message
    {
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        if ($message->isDeleted || $message->deletedById) {
            throw new \InvalidArgumentException('Message cannot be updated.');
        }

        $maxTime = (int) env('MAX_TIME_FOR_UPDATE_MESSAGE', 15);
        if ($message->created_at->diffInMinutes(now()) > $maxTime) {
            throw new \InvalidArgumentException('Message cannot be updated after maximum time limit.');
        }

        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if ($message->user_id !== $userId || !$isParticipant) {
            throw new \UnauthorizedException('You are not authorized to update this message.');
        }

        $message->update([
            'isEdited' => true,
            'body' => $body,
        ]);

        $conversation = $message->conversation;
        if ($conversation && $conversation->type !== 'direct') {
            $this->mentionService->syncForSource(
                content: $body,
                sourceType: 'message',
                sourceId: $message->id,
                workspaceId: $workspaceId,
                mentionedBy: $userId
            );
        }

        broadcast(new MessageUpdated($message))->toOthers();

        return $message;
    }
}
