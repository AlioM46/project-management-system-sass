<?php

namespace App\Modules\Comments\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use App\Modules\Comments\Model\Mention as ModelMention;

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
    // 🟡 1. DELETE ONLY THIS SOURCE mentions
    ModelMention::where('source_type', $sourceType)
        ->where('source_id', $sourceId)
        ->delete();

    // 🟢 2. Extract usernames from content
    $usernames = $this->extractUsernames($content);

    $usernames = $usernames
        ->unique()
        ->values();

    if ($usernames->isEmpty()) {
        return;
    }

    // 🟢 3. Resolve users (workspace scoped)
    $users = $this->resolveUsers($usernames, $workspaceId);

    if ($users->isEmpty()) {
        return;
    }

    // 🟢 4. Insert mentions
    $rows = $users->map(fn ($user) => [
        'mentioned_user_id' => $user->id,
        'workspace_id' => $workspaceId,
        'source_type' => $sourceType,
        'source_id' => $sourceId,
        'mentioned_by_user_id' => $mentionedBy,
        'created_at' => now(),
        'updated_at' => now(),
    ])->toArray();

    ModelMention::insert($rows);
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
            ->whereHas('workspaces', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->get();
    }

    public function store(
        Collection $users,
        string $sourceType,
        int $sourceId,
        int $workspaceId,
        int $mentionedBy
    ): void {
        if ($users->isEmpty()) return;

        $rows = $users->map(fn($user) => [
            'mentioned_user_id' => $user->id,
            'workspace_id' => $workspaceId,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'mentioned_by_user_id' => $mentionedBy,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        ModelMention::insertOrIgnore($rows);
    }
}
