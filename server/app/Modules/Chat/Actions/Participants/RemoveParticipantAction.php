<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Participants;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;

final class RemoveParticipantAction
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    public function execute(int $conversationId, int $targetUserId, int $workspaceId, int $authUserId): void
    {
        $conversation = Conversation::with('participants.user')->findOrFail($conversationId);

        if (!in_array(strtolower($conversation->type), ['group', 'project'], true)) {
            throw new \InvalidArgumentException('Cannot remove participants from a direct conversation.');
        }

        $targetUser = $conversation->participants->where('user_id', $targetUserId)->first();
        if (!$targetUser) {
            throw new \InvalidArgumentException('User is not a participant in this conversation.');
        }

        if (!$this->canRemoveParticipant($conversation, $targetUser, $authUserId)) {
            throw new \UnauthorizedException('You do not have permission to remove this participant.');
        }

        $conversation->participants()->where('user_id', $targetUserId)->delete();

        $this->notificationService->send(
            $workspaceId,
            $targetUser->user_id,
            NotificationType::INFO,
            [
                'message' => "You were removed from `{$conversation->name}` conversation",
                'conversation' => $conversation,
                'conversationId' => $conversation->id,
                'senderId' => $authUserId,
                'workspaceId' => $workspaceId,
            ]
        );

        $remainingParticipants = $conversation->participants
            ->where('user_id', '!=', $targetUserId)
            ->where('user_id', '!=', $authUserId);

        foreach ($remainingParticipants as $participant) {
            $this->notificationService->send(
                $workspaceId,
                $participant->user_id,
                NotificationType::INFO,
                [
                    'message' => "User `{$targetUser->user->name}` was removed from `{$conversation->name}` conversation",
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => $authUserId,
                    'workspaceId' => $workspaceId,
                ]
            );
        }
    }

    private function canRemoveParticipant(Conversation $conversation, ConversationParticipant $targetUser, int $authUserId): bool
    {
        $currentUser = $conversation->participants->where('user_id', $authUserId)->first();

        if (!$currentUser) {
            return false;
        }

        $isCurrentUserOwner = $currentUser->role === 'owner';
        $isCurrentUserAdmin = $currentUser->role === 'admin';
        $isCurrentUserMember = $currentUser->role === 'member';

        $isTargetOwner = $targetUser->role === 'owner';
        $isTargetAdmin = $targetUser->role === 'admin';
        $isTargetMember = $targetUser->role === 'member';

        if ($isCurrentUserMember) {
            return false;
        }

        if ($isCurrentUserOwner) {
            return true;
        }

        if ($isTargetOwner) {
            return false;
        }

        if ($isCurrentUserAdmin && $isTargetAdmin) {
            return false;
        }

        if ($isCurrentUserAdmin && $isTargetMember) {
            return true;
        }

        return false;
    }
}
