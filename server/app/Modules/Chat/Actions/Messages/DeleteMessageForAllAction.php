<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Events\MessageDeleted;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;
use App\Modules\Comments\Services\MentionService;

final class DeleteMessageForAllAction
{
    public function __construct(
        private MentionService $mentionService,
    ) {}

    public function execute(int $conversationId, int $messageId, int $userId): Message
    {
        $message = Message::where('conversation_id', $conversationId)->findOrFail($messageId);

        $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant) {
            throw new \UnauthorizedException('You are not authorized to delete this message.');
        }

        $isSender = $message->user_id === $userId;
        $isAdmin = ConversationParticipant::where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->whereIn('role', ['admin', 'owner'])
            ->exists();

        if (!$isSender && !$isAdmin) {
            throw new \UnauthorizedException('You are not authorized to delete this message.');
        }

        if ($isSender && !$isAdmin) {
            $maxTime = (int) env('MAX_TIME_FOR_DELETE_MESSAGE', 15);
            if ($message->created_at->diffInMinutes(now()) > $maxTime) {
                throw new \InvalidArgumentException('You cannot delete messages after time limit.');
            }
        }

        $message->update([
            'isDeleted' => true,
            'deletedById' => $userId,
            'body' => '',
        ]);

        $this->mentionService->deleteBySource('message', $message->id);

        broadcast(new MessageDeleted($message))->toOthers();

        return $message;
    }
}
