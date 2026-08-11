<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Messages;

use App\Modules\Chat\Events\MessageSent;
use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\ConversationReadState;
use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Services\MessageAttachmentService;
use App\Modules\Comments\Services\MentionService;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;

final class SendMessageAction
{
    public function __construct(
        private MessageAttachmentService $messageAttachmentService,
        private MentionService $mentionService,
        private NotificationService $notificationService,
    ) {
    }

    public function execute(
        int $conversationId,
        int $userId,
        int $workspaceId,
        ?string $body = null,
        ?int $replyId = null,
        array $attachments = []
    ): Message {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'project') {
            $isParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->exists();

            if (!$isParticipant) {
                throw new \UnauthorizedException('Unauthorized.');
            }
        }

        if ($conversation->type === 'direct') {
            ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('is_active', false)
                ->update(['is_active' => true, 'joined_at' => now()]);

            $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId)
                ->where('is_active', true)
                ->first();

            $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

            if (!$partnerId) {
                throw new \InvalidArgumentException('Partner not found.');
            }

            $isBlocked = BlockedUser::where('workspace_id', $workspaceId)
                ->where(function ($query) use ($partnerId, $userId) {
                    $query->where(function ($q1) use ($partnerId, $userId) {
                        $q1->where('blocked_id', $partnerId)->where('blocker_id', $userId);
                    })->orWhere(function ($q2) use ($partnerId, $userId) {
                        $q2->where('blocked_id', $userId)->where('blocker_id', $partnerId);
                    });
                })
                ->exists();

            if ($isBlocked) {
                throw new \InvalidArgumentException('Message cannot be delivered. User block relationship is active.');
            }
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'message_id' => $replyId,
            'user_id' => $userId,
            'body' => $body ?? '',
        ]);

        if (!empty($attachments)) {
            $this->messageAttachmentService->upload($message, $attachments);
        }

        if ($conversation->type !== 'direct') {
            $usernames = $this->mentionService->extractUsernames($message->body);
            $users = $this->mentionService->resolveUsers($usernames, $workspaceId);
            $this->mentionService->store(
                users: $users,
                sourceType: 'message',
                sourceId: $message->id,
                workspaceId: $workspaceId,
                mentionedBy: $userId
            );
        }

        $message = Message::with([
            'sender:id,name,avatar_url,username',
            'parent.sender:id,name',
            'reactions.user:id,name',
            'attachments',
            'mentions.mentionedUser'
        ])->find($message->id);

        broadcast(new MessageSent($message))->toOthers();

        ConversationReadState::updateOrCreate(
            ['user_id' => $userId, 'conversation_id' => $conversation->id],
            ['read_at' => now()]
        );

        $allParticipants = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('is_active', true)
            ->get();

        foreach ($allParticipants as $participant) {
            if ((int) $participant->user_id === $userId) {
                continue;
            }

            $isMuted = $participant->muted_until && $participant->muted_until->isFuture();

            $this->notificationService->send(
                $workspaceId,
                $participant->user_id,
                NotificationType::CHAT_MESSAGE,
                [
                    'message' => $message,
                    'conversation' => $conversation->load('project:id,name'),
                    'is_muted' => $isMuted,
                ]
            );
        }

        return $message;
    }
}
