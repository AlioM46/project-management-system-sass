<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Participants;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;

final class ChangeParticipantRoleAction
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    public function execute(int $conversationId, int $participantId, string $newRole, int $workspaceId, int $authUserId): ConversationParticipant
    {
        $conversation = Conversation::findOrFail($conversationId);

        $targetParticipant = ConversationParticipant::where('id', $participantId)
            ->where('conversation_id', $conversationId)
            ->firstOrFail();

        $currentUserParticipant = ConversationParticipant::where('user_id', $authUserId)
            ->where('conversation_id', $conversationId)
            ->first();

        if (!$currentUserParticipant) {
            throw new \UnauthorizedException('You are not a participant in this conversation.');
        }

        if (!$this->canChangeRole($currentUserParticipant, $targetParticipant, $newRole)) {
            throw new \UnauthorizedException('You do not have permission to change this participant role.');
        }

        $targetParticipant->update(['role' => $newRole]);

        $this->notificationService->send(
            $workspaceId,
            $targetParticipant->user_id,
            NotificationType::INFO,
            [
                'message' => "Your role in `{$conversation->name}` was changed to `{$newRole}`",
                'conversation' => $conversation,
                'conversationId' => $conversation->id,
                'senderId' => $authUserId,
                'workspaceId' => $workspaceId,
            ]
        );

        return $targetParticipant;
    }

    private function canChangeRole(ConversationParticipant $currentUser, ConversationParticipant $targetUser, string $newRole): bool
    {
        if ($currentUser->role === 'member') {
            return false;
        }

        if ($targetUser->role === 'owner') {
            return false;
        }

        if ($currentUser->role === 'admin' && $targetUser->role === 'admin') {
            return false;
        }

        if ($currentUser->role === 'owner') {
            return true;
        }

        if ($currentUser->role === 'admin' && $targetUser->role === 'member' && in_array($newRole, ['admin', 'member'], true)) {
            return true;
        }

        return false;
    }
}
