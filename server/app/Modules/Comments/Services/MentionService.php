<?php

namespace App\Modules\Comments\Services;

use App\Models\User;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Support\Collection;
use App\Modules\Comments\Model\Mention as ModelMention;
use Notification;

class MentionService
{



    public function deleteBySource(string $sourceType, int $sourceId): void
    {
        ModelMention::where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->delete();
    }

    public function syncForSource(
        string $content,
        string $sourceType,
        int $sourceId,
        int $workspaceId,
        int $mentionedBy
    ): void {
        // 🟡 1. Get existing mentions BEFORE deleting
        $oldMentions = ModelMention::where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->get();

        $oldUserIds = $oldMentions->pluck('mentioned_user_id')->toArray();

        // 🟢 2. Extract usernames from content
        $usernames = $this->extractUsernames($content)
            ->unique()
            ->values();

        if ($usernames->isEmpty()) {
            return;
        }

        // 🟢 3. Resolve users
        $users = $this->resolveUsers($usernames, $workspaceId);

        if ($users->isEmpty()) {
            return;
        }

        $newUserIds = $users->pluck('id')->toArray();

        // 🔥 4. Calculate ONLY NEW mentions
        $toNotifyIds = array_diff($newUserIds, $oldUserIds);

        // 🟡 5. Replace mentions (sync behavior)
        ModelMention::where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->delete();

        $rows = $users->map(fn($user) => [
            'mentioned_user_id' => $user->id,
            'workspace_id' => $workspaceId,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'mentioned_by_user_id' => $mentionedBy,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        ModelMention::insert($rows);

        // 🔔 6. Notify ONLY new mentions
        foreach ($users->whereIn('id', $toNotifyIds) as $user) {

            app(NotificationService::class)->send(
                $workspaceId,
                $user->id,
                NotificationType::MENTIONED,
                [
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                ]
            );
        }
    }
    public function extractUsernames(string $content): Collection
    {
        preg_match_all('/@([\w]+)/', $content, $matches);

        return collect($matches[1])
            ->unique()
            ->values();
    }

    public function resolveUsers(Collection $usernames, int $workspaceId): Collection
    {
        if ($usernames->isEmpty()) {
            return collect();
        }

        return User::whereIn('username', $usernames)
            ->whereHas('workspaces', fn($q) => $q->where('workspace_id', $workspaceId))
            ->get();
    }

    public function store(
        Collection $users,
        string $sourceType,
        int $sourceId,
        int $workspaceId,
        int $mentionedBy
    ): void {
        if ($users->isEmpty())
            return;

        $rows = $users->map(fn($user) => [
            'mentioned_user_id' => $user->id,
            'workspace_id' => $workspaceId,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'mentioned_by_user_id' => $mentionedBy,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        foreach ($users as $user) {

            app(NotificationService::class)->send(
                $workspaceId,
                $user->id,
                NotificationType::MENTIONED,
                [
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                ]
            );
        }

        // Notify each user about the mention (you can implement this as needed, e.g., using Laravel Notifications)



        ModelMention::insertOrIgnore($rows);
    }
}
