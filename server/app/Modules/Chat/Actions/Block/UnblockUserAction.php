<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Block;

use App\Modules\Chat\Model\BlockedUser;

final class UnblockUserAction
{
    public function execute(int $blockerId, int $unblockedUserId, int $workspaceId): void
    {
        BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $blockerId)
            ->where('blocked_id', $unblockedUserId)
            ->delete();
    }
}
