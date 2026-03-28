<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Collection;

class SyncWorkspaceDefaults
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceRoleProvisioningService $workspaceRoleProvisioningService
    ) {
    }

    public function execute(): Collection
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if (!$workspace) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return collect($this->workspaceRoleProvisioningService->provisionForWorkspace($workspace))
            ->sortBy('name')
            ->values();
    }
}
