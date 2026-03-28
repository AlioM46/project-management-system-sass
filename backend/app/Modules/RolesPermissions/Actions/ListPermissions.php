<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use Illuminate\Database\Eloquent\Collection;

class ListPermissions
{
    public function __construct(
        private readonly PermissionCatalogService $permissionCatalogService
    ) {
    }

    public function execute(): Collection
    {
        $this->permissionCatalogService->syncSystemPermissions();

        return Permission::query()
            ->orderBy('key')
            ->get();
    }
}
