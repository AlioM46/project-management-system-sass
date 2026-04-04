<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;

class ShowCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function execute(): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $workspace->load([
            'owner:id,name,email',
        ])->loadCount('members');

        return ['workspace' => $workspace];
    }
}
