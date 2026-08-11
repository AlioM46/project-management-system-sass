<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
use App\Modules\Chat\Model\ConversationReadState;
use App\Modules\Chat\Model\Message;
use Illuminate\Support\Collection;

final class GetConversationsListAction
{
    public function execute(int $userId): Collection
    {
        $conversations = Conversation::query()
            ->where(function ($query) use ($userId) {
                $query->where('type', 'project')
                    ->orWhereHas('participants', function ($q) use ($userId) {
                        $q->where('user_id', $userId)->where('is_active', true);
                    });
            })
            ->withExists([
                'pinnedUsers as is_pinned' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }
            ])
            ->with(['project:id,name', 'participants.user:id,name,avatar_url,custom_status,username'])
            ->get();

        return $conversations->map(function ($conversation) use ($userId) {
            $readStatus = ConversationReadState::where('user_id', $userId)
                ->where('conversation_id', $conversation->id)
                ->first();

            $lastReadAt = $readStatus ? $readStatus->read_at : null;

            $unreadCount = Message::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $userId)
                ->when($lastReadAt, function ($query) use ($lastReadAt) {
                    $query->where('created_at', '>', $lastReadAt);
                })
                ->count();

            $lastMessage = $conversation->messages()
                ->with('sender:id,name,avatar_url,username')
                ->latest()
                ->first();

            $participant = $conversation->participants->firstWhere('user_id', $userId);
            $mutedUntil = $participant ? $participant->muted_until : null;
            $isMuted = $mutedUntil ? $mutedUntil->isFuture() : false;

            $isBlockedByMe = false;
            $isBlockedByPartner = false;

            if ($conversation->type === 'direct') {
                $partnerParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $userId)
                    ->where('is_active', true)
                    ->first();

                $partnerId = $partnerParticipant ? $partnerParticipant->user_id : null;

                if ($partnerId) {
                    $isBlockedByMe = BlockedUser::where('workspace_id', $conversation->workspace_id)
                        ->where('blocker_id', $userId)
                        ->where('blocked_id', $partnerId)
                        ->exists();

                    $isBlockedByPartner = BlockedUser::where('workspace_id', $conversation->workspace_id)
                        ->where('blocker_id', $partnerId)
                        ->where('blocked_id', $userId)
                        ->exists();
                }
            }

            $data = $conversation->toArray();
            $data['is_pinned'] = (bool) ($conversation->is_pinned ?? false);
            $data['unread_count'] = $unreadCount;
            $data['last_message'] = $lastMessage;
            $data['is_muted'] = $isMuted;
            $data['muted_until'] = $mutedUntil ? $mutedUntil->toIso8601String() : null;
            $data['is_blocked_by_me'] = $isBlockedByMe;
            $data['is_blocked_by_partner'] = $isBlockedByPartner;

            return $data;
        })->sortByDesc('is_pinned')->values();
    }
}
