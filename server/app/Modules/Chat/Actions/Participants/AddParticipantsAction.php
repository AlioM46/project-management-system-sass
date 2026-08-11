<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Participants;

use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;

final class AddParticipantsAction
{
    public function __construct(
        private NotificationService $notificationService,
    ) {}

    public function execute(int $conversationId, array $userIds, int $workspaceId, int $authUserId): void
    {
        $conversation = Conversation::findOrFail($conversationId);

        if (!in_array(strtolower($conversation->type), ['group', 'project'], true)) {
            throw new \InvalidArgumentException('Cannot add participants to a direct conversation.');
        }

        $existingUserIds = ConversationParticipant::where('conversation_id', $conversationId)
            ->pluck('user_id')
            ->toArray();

        $newUsersToAdd = array_values(array_diff($userIds, $existingUserIds));

        if (empty($newUsersToAdd)) {
            return;
        }

        $now = now();
        $insertData = array_map(function ($userId) use ($conversationId, $now, $workspaceId, $conversation, $authUserId) {
            $this->notificationService->send(
                $workspaceId,
                $userId,
                NotificationType::INFO,
                [
                    'message' => "You were added to `{$conversation->name}` conversation",
                    'conversation' => $conversation,
                    'conversationId' => $conversation->id,
                    'senderId' => $authUserId,
                    'workspaceId' => $workspaceId,
                ]
            );

            return [
                'workspace_id' => $workspaceId,
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'role' => 'member',
                'is_active' => true,
                'joined_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $newUsersToAdd);

        ConversationParticipant::insert($insertData);
    }
}
