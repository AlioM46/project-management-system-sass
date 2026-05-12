<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;

class ListUserWorkspaces
{
    public function execute(User $user): array
    {
        return Workspace::query()
        // accessibleTo is a scope that checks if the user is a member of the workspace
        // or the owner
        // SQL Code:

        // SELECT * FROM workspaces
        // where workspace_created_by_user_id = $user->id
        // OR
        // JOIN workspace_members ON workspaces.id = workspace_members.workspace_id
        // WHERE workspace_members.user_id = $user->id

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
