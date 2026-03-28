<?php

namespace App\Modules\RolesPermissions\Services;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

/**
 * Apply the default system roles to one workspace.
 *
 * This service does not define the catalog itself.
 * It only takes the catalog from PermissionCatalogService and writes it into
 * the current workspace's roles/role_permissions records.
 */
class WorkspaceRoleProvisioningService
{
    public function __construct(
        private readonly PermissionCatalogService $permissionCatalogService
    ) {
    }

    /**
     * Create or update Owner/Admin/Member for one workspace.
     *
     * When it runs:
     * - right after workspace creation
     * - when the defaults sync action is called
     *
     * Result example:
     * [
     *   'owner' => Role {...},
     *   'admin' => Role {...},
     *   'member' => Role {...},
     * ]
     */
    public function provisionForWorkspace(Workspace $workspace): array
    {
        $permissionsByKey = $this->permissionCatalogService->syncSystemPermissions();
        $defaultRoleDefinitions = $this->permissionCatalogService->defaultRoleDefinitions();
        $roles = [];
        $systemRoleNames = collect($defaultRoleDefinitions)
            ->pluck('name')
            ->all();

        foreach ($defaultRoleDefinitions as $definition) {
            $role = $this->upsertWorkspaceRole($workspace, $definition);
            $permissionSyncData = $this->buildPermissionSyncData($definition['permissions'], $permissionsByKey);

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

    /**
     * Create the workspace role if missing, or update it if it already exists.
     *
     * Result example:
     * Role {
     *   id: 3,
     *   workspace_id: 7,
     *   name: "Admin",
     *   is_system: true
     * }
     */
    private function upsertWorkspaceRole(Workspace $workspace, array $definition): Role
    {
        return Role::query()
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
    }

    /**
     * Convert permission keys into the format expected by belongsToMany()->sync().
     *
     * Input example:
     * ['workspace.view', 'task.assign']
     *
     * Result example:
     * [
     *   10 => ['permission_key' => 'workspace.view'],
     *   21 => ['permission_key' => 'task.assign'],
     * ]
     */
    private function buildPermissionSyncData(array $permissionKeys, \Illuminate\Support\Collection $permissionsByKey): array
    {
        $permissionSyncData = [];

        foreach ($permissionKeys as $permissionKey) {
            $permission = $permissionsByKey->get($permissionKey);

            if (!$permission) {
                continue;
            }

            $permissionSyncData[$permission->id] = [
                'permission_key' => $permission->key,
            ];
        }

        return $permissionSyncData;
    }
}
