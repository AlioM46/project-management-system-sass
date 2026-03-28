<?php

namespace App\Modules\RolesPermissions\Services;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

class WorkspaceRoleProvisioningService
{
    public function __construct(
        private readonly PermissionCatalogService $permissionCatalogService
    ) {
    }

    public function provisionForWorkspace(Workspace $workspace): array
    {
        $permissionsByKey = $this->permissionCatalogService->syncSystemPermissions();
        $roles = [];
        $systemRoleNames = collect($this->permissionCatalogService->defaultRoleDefinitions())
            ->pluck('name')
            ->all();

        foreach ($this->permissionCatalogService->defaultRoleDefinitions() as $definition) {
            $role = Role::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->updateOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'name' => $definition['name'],
                    ],
                    [
                        'description' => $definition['description'],
                        'is_system' => true,
                    ]
                );

            $permissionSyncData = [];

            foreach ($definition['permissions'] as $permissionKey) {
                $permission = $permissionsByKey->get($permissionKey);

                if (!$permission) {
                    continue;
                }

                $permissionSyncData[$permission->id] = [
                    'permission_key' => $permission->key,
                ];
            }

            $role->permissions()->sync($permissionSyncData);
            $role->load([
                'permissions' => fn ($query) => $query->orderBy('key'),
            ]);

            $roles[$definition['key']] = $role;
        }

        Role::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->where('is_system', true)
            ->whereNotIn('name', $systemRoleNames)
            ->update(['is_system' => false]);

        return $roles;
    }
}
