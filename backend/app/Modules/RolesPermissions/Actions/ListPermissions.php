<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use Illuminate\Database\Eloquent\Collection;

/**
 * Use-case: return the global permission catalog.
 */
class ListPermissions
{
    public function __construct(
        private readonly PermissionCatalogService $permissionCatalogService
    ) {
    }

    /**
     * Ensure the catalog exists in the database, then return it sorted by key.
     *
     * Result example:
     * [
     *   Permission { key: "audit.export" },
     *   Permission { key: "audit.view" },
     *   Permission { key: "comment.create" },
     * ]
     */
    public function execute(): Collection
    {
        $this->permissionCatalogService->syncSystemPermissions();

        return Permission::query()
            ->orderBy('key')
            ->get();
    }
}
