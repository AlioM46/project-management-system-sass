<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions\Block;

use App\Modules\Chat\Model\BlockedUser;
use Illuminate\Support\Collection;

final class GetBlockedUsersAction
{
    public function execute(int $userId, int $workspaceId): Collection
    {
        return BlockedUser::where('workspace_id', $workspaceId)
            ->where('blocker_id', $userId)
            ->with('blocked:id,name,email,avatar_url,username')
            ->get()
            ->pluck('blocked');
    }
}
