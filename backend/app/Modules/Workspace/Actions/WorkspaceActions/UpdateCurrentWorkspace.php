<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;

class UpdateCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function execute(array $data): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if ($data !== []) {
            $workspace->fill($data);

            if ($workspace->isDirty()) {
                $workspace->save();
            }
        }

        $workspace->load([
            'owner:id,name,email',
        ])->loadCount('members');

        return ['workspace' => $workspace];
    }
}
