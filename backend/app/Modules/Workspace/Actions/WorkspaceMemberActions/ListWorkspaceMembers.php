<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;

class ListWorkspaceMembers
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {}

    public function execute(): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $members = $workspace->members()
            ->with([
                'user:id,name,email',
                'role:id,workspace_id,name,description,is_system',
            ])
            ->orderByDesc('joined_at')
            ->get();

        return ['members' => $members];
    }
}
