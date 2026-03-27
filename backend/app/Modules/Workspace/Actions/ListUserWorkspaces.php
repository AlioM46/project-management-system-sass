<?php

namespace App\Modules\Workspace\Actions;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;

class ListUserWorkspaces
{
    public function execute(User $user): array
    {
        return Workspace::query()
            ->accessibleTo($user->id)
            ->select('id', 'name')
            ->withCount('members')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Workspace $workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'members_count' => $workspace->members_count,
            ])
            ->values()
            ->all();
    }
}
