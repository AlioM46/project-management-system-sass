<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Block;

use App\Modules\Chat\Model\BlockedUser;

final class BlockUserAction
{
    public function execute(int $blockerId, int $blockedUserId, int $workspaceId): void
    {
        if ($blockerId === $blockedUserId) {
            throw new \InvalidArgumentException('You cannot block yourself.');
        }

        $alreadyBlocked = BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $blockerId)
            ->where('blocked_id', $blockedUserId)
            ->exists();

        if (!$alreadyBlocked) {
            BlockedUser::create([
                'workspace_id' => $workspaceId,
                'blocker_id' => $blockerId,
                'blocked_id' => $blockedUserId,
            ]);
        }
    }
}
