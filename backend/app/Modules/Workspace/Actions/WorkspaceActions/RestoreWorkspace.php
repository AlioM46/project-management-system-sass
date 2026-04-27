<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;

class RestoreWorkspace
{
    public function execute(int $workspaceId, User $user): array
    {
        // find(id): by default, it does not return deleted_at != null records,
        // so we need to use withTrashed() to include them in the search
        $workspace = Workspace::withTrashed()->find($workspaceId);

        if ($workspace === null) {
            throw WorkspaceContextException::workspaceNotFound($workspaceId);
        }

        if (! $workspace->isManagedBy($user->id)) {
            throw WorkspaceContextException::workspaceNotManagedByUser($user->name, $workspace->id);
        }

        if (! $workspace->trashed()) {
            throw WorkspaceContextException::workspaceNotArchived($workspace->id);
        }

        $workspace->restore();

        $workspace = $workspace->fresh();
        $workspace->load([
            'owner:id,name,email',
        ])->loadCount('members');

        return ['workspace' => $workspace];
    }
}
