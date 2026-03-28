<?php

use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionCatalogService::class)->syncSystemPermissions();

        $provisioningService = app(WorkspaceRoleProvisioningService::class);

        Workspace::query()
            ->select(['id', 'name', 'created_by_user_id'])
            ->each(function (Workspace $workspace) use ($provisioningService): void {
                $provisioningService->provisionForWorkspace($workspace);
            });
    }

    public function down(): void
    {
        // Irreversible data migration: legacy wildcard permissions are intentionally removed.
    }
};
