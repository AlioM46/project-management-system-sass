<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Conversations;

use App\Modules\Chat\Model\BlockedUser;
use App\Modules\Chat\Model\Conversation;

final class GetConversationSidebarInfoAction
{
    public function execute(int $conversationId, int $userId, int $workspaceId): array
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->with([
                'project:id,name',
                'participants.user:id,name,email,avatar_url,custom_status',
            ])
            ->findOrFail($conversationId);

        $isParticipant = $conversation->participants()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isParticipant && $conversation->type !== 'project') {
            throw new \UnauthorizedException('You are not authorized to view this conversation info.');
        }

        $allAttachments = $conversation->attachments()
            ->select('message_attachments.*')
            ->latest()
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'message_id' => $att->message_id,
                    'original_name' => $att->original_name,
                    'file_type' => $att->file_type,
                    'file_size' => $att->file_size,
                    'download_url' => $att->download_url,
                    'created_at' => $att->created_at,
                ];
            });

        $mediaAttachments = $allAttachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            return str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
        })->values();

        $docAttachments = $allAttachments->filter(function ($att) {
            $type = strtolower($att['file_type'] ?? '');
            $name = strtolower($att['original_name'] ?? '');
            $isMedia = str_starts_with($type, 'image/') ||
                str_starts_with($type, 'video/') ||
                str_starts_with($type, 'audio/') ||
                str_contains($name, 'voice_note');
            return !$isMedia;
        })->values();

        $groupsInCommon = [];
        if ($conversation->type === 'direct') {
            $partner = $conversation->participants->firstWhere('user_id', '!=', $userId);
            if ($partner) {
                $partnerUserId = $partner->user_id;
                $groupsInCommon = Conversation::where('workspace_id', $workspaceId)
                    ->where('type', 'group')
                    ->whereHas('participants', function ($q) use ($userId) {
                        $q->where('user_id', $userId)->where('is_active', true);
                    })
                    ->whereHas('participants', function ($q) use ($partnerUserId) {
                        $q->where('user_id', $partnerUserId)->where('is_active', true);
                    })
                    ->select('id', 'name', 'type', 'created_at')
                    ->get();
            }
        }

        $myParticipant = $conversation->participants->firstWhere('user_id', $userId);
        $mutedUntil = $myParticipant ? $myParticipant->muted_until : null;
        $isMuted = $mutedUntil ? $mutedUntil->isFuture() : false;

        $isBlockedByMe = false;
        $isBlockedByPartner = false;
        if ($conversation->type === 'direct') {
            $partner = $conversation->participants->firstWhere('user_id', '!=', $userId);
            if ($partner) {
                $isBlockedByMe = BlockedUser::where('workspace_id', $workspaceId)
                    ->where('blocker_id', $userId)
                    ->where('blocked_id', $partner->user_id)
                    ->exists();

                $isBlockedByPartner = BlockedUser::where('workspace_id', $workspaceId)
                    ->where('blocker_id', $partner->user_id)
                    ->where('blocked_id', $userId)
                    ->exists();
            }
        }

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'name' => $conversation->name,
            'description' => $conversation->description,
            'project' => $conversation->project,
            'is_muted' => $isMuted,
            'muted_until' => $mutedUntil ? $mutedUntil->toIso8601String() : null,
            'is_blocked_by_me' => $isBlockedByMe,
            'is_blocked_by_partner' => $isBlockedByPartner,
            'participants' => $conversation->participants,
            'media_attachments' => $mediaAttachments,
            'doc_attachments' => $docAttachments,
            'groups_in_common' => $groupsInCommon,
        ];
    }
}
