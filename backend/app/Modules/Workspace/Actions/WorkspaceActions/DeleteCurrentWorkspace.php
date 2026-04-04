<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;

class DeleteCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function execute(User $user): array
    {
        $currentWorkspace = $this->workspaceContextService->currentWorkspace();

        if ($currentWorkspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$currentWorkspace->isManagedBy($user->id)) {
            throw WorkspaceContextException::workspaceNotManagedByUser($user->name, $currentWorkspace->id);
        }

        $currentWorkspace->delete();

        return [
            'workspace' => [
                'id' => $currentWorkspace->id,
                'deleted_at' => $currentWorkspace->deleted_at,
            ],
        ];
    }
}
