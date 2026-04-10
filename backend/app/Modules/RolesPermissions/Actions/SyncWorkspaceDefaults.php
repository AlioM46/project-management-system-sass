<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Collection;

/**
 * Use-case: rebuild the default system roles for the active workspace.
 */
class SyncWorkspaceDefaults
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceRoleProvisioningService $workspaceRoleProvisioningService
    ) {
    }

    /**
     * Read the current workspace from middleware context, then re-provision roles.
     *
     * Result example:
     * collect([
     *   Role { name: "Admin" },
     *   Role { name: "Member" },
     *   Role { name: "Owner" },
     * ])
     */
    public function execute(): Collection
    {
        return collect($this->workspaceRoleProvisioningService->provisionForWorkspace(
            $this->currentWorkspace()
        ))
            ->sortBy('name')
            ->values();
    }

    /**
     * Helper to keep execute() focused on the happy path.
     */
    private function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }
}
