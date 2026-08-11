<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Receipts;

use App\Modules\Chat\Events\MessageDelivered;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\Message;

final class MarkAllDeliveredOnPresenceJoinAction
{
    public function execute(int $userId): void
    {
        $conversationIds = ConversationParticipant::where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('conversation_id');

        $directConversationIds = Conversation::whereIn('id', $conversationIds)
            ->where('type', 'direct')
            ->pluck('id');

        $hasUndelivered = Message::whereIn('conversation_id', $directConversationIds)
            ->where('user_id', '!=', $userId)
            ->whereNull('delivered_at')
            ->exists();

        if ($hasUndelivered) {
            Message::whereIn('conversation_id', $directConversationIds)
                ->where('user_id', '!=', $userId)
                ->whereNull('delivered_at')
                ->update(['delivered_at' => now()]);

            foreach ($directConversationIds as $cId) {
                $c = Conversation::find($cId);
                if ($c) {
                    broadcast(new MessageDelivered($c->workspace_id, $cId, now()->toIso8601String()))->toOthers();
                }
            }
        }

        $groupConversations = Conversation::whereIn('id', $conversationIds)
            ->where('type', '!=', 'direct')
            ->get();

        if ($groupConversations->isNotEmpty()) {
            $undeliveredGroupMessages = Message::whereIn('conversation_id', $groupConversations->pluck('id'))
                ->where('user_id', '!=', $userId)
                ->whereNull('delivered_at')
                ->get();

            foreach ($undeliveredGroupMessages as $message) {
                $otherMemberIds = ConversationParticipant::where('conversation_id', $message->conversation_id)
                    ->where('user_id', '!=', $message->user_id)
                    ->where('is_active', true)
                    ->pluck('user_id');

                $otherMembersCount = $otherMemberIds->count();
                if ($otherMembersCount > 0) {
                    $deliveredCount = ConversationParticipant::where('conversation_id', $message->conversation_id)
                        ->whereIn('user_id', $otherMemberIds)
                        ->where('joined_at', '<=', now())
                        ->count();

                    if ($deliveredCount >= $otherMembersCount) {
                        $message->update(['delivered_at' => now()]);
                        $c = Conversation::find($message->conversation_id);
                        if ($c) {
                            broadcast(new MessageDelivered($c->workspace_id, $message->conversation_id, now()->toIso8601String()))->toOthers();
                        }
                    }
                }
            }
        }
    }
}
