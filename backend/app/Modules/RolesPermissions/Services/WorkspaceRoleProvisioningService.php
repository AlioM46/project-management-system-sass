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
        // Ensure the database have the default full list of system permissions before provisioning the default roles.
        $permissionsByKey = $this->permissionCatalogService->syncSystemPermissions();



            /*  
            'key' => "owner",
            'name' => self::DEFAULT_ROLE_KEYS[$roleKey]['name'] = "Owner",
            'description' => self::DEFAULT_ROLE_KEYS[$roleKey]['description'] = "Full Control....",
            'permissions' => $permissions = [workspace.view,......],
            */

        $defaultRoleDefinitions = $this->permissionCatalogService->defaultRoleDefinitions();
        $roles = [];
        $systemRoleNames = collect($defaultRoleDefinitions)
            ->pluck('name')
            ->all();

        foreach ($defaultRoleDefinitions as $definition) {
            $role = $this->upsertWorkspaceRole($workspace, $definition);
            $permissionSyncData = $this->buildPermissionSyncData($definition['permissions'], $permissionsByKey);
            /* result example:
            [
                10 => ['permission_key' => 'workspace.view'],
                21 => ['permission_key' => 'task.assign'],
            ]       */


                /* what is sync() do?
                The sync method is used to synchronize the intermediate table with a list of IDs or ID and
                another words: used to attach the new permissions data into roles, means:
                it will affect the M-M relation in the role_permissions table, 
                it will insert new rows if the permission id is not exist in the relation,
                and delete the rows if the permission id is not exist in the sync data,
                and keep the rows if the permission id exist in the sync data.
                */
                // Summary: ->permissions() -> is the M-M relation
                // Summary: ->sync() -> means to handle the M-M relation using the $permissionSyncData Ids
            $role->permissions()->sync($permissionSyncData);
            // sync:
            // What it does internally:
            // 
            // ✅ attaches new permission IDs
            // ❌ removes old ones not in the list
            // 🔁 updates pivot data (permission_key)



            /*
            Why is it needed?
            After sync():
            The database is updated ✅
            But the $role object in memory may still have:
            old permissions
            or no permissions loaded at all
            So load() ensures:
            “Give me the latest ordered permissions from the DB and attach them to this $role object.”
            */
            $role->load([
                'permissions' => fn($query) => $query->orderBy('key'),
            ]);

            $roles[$definition['key']] = $role;
        }

        /*so the process happen is:
        -> permissions is the M-M relation
        -> sync() -> handle the M-M relation by attach the new ids of permissions into the associative table.
        Load() -> IDK?
        */

        //“For this workspace, any old system role 
        // that is no longer in today's default role list should stop being marked as a system role.”
        // eg: previous default roles were Owner/Admin/Member, 
        // but now we changed the default list to Owner/Collaborator, so the old Admin/Member 
        // roles should be unmarked as system roles, because they are no longer in the default list.
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
        // Why removing the global scope?: 
        // if I create workspace, the x-workspace-id is null, 
        // so the global scope would throw an error, because it always runs and looking up for x-workspace-id, 
        // so I have to stop it, and provide the workspace-id Manually.
      
        // additional:

        // Why remove the global scope?
        // When creating/provisioning a new workspace, there may be no current
        // X-Workspace-Id header yet.
        //
        // If the Role model still uses WorkspaceTenantScope, any query like
        // updateOrCreate() will automatically try to resolve the current workspace
        // from the header/context.
        //
        // Since X-Workspace-Id is null at that moment, the scope throws a
        // missing workspace context error.
        //
        // So for provisioning, we disable the global scope and pass workspace_id
        // explicitly in the query.
        //
        // In short:
        // - normal app flow => use tenant scope + X-Workspace-Id
        // - provisioning/system flow => bypass tenant scope + set workspace_id manually
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
    private function buildPermissionSyncData(array $permissionKeysPerDefaultRole, \Illuminate\Support\Collection $permissionsByKey): array
    {
        /*
        permissionKeysPerDefaultRole = ['workspace.view', 'task.assign']
        permissionsByKey = {
            'workspace.view' => Permission { id: 10, key: 'workspace.view', name: 'View Workspace' },
            'task.assign' => Permission { id: 21, key: 'task.assign', name: 'Assign Task' },
            ...
        }
        */
        $permissionSyncData = [];

        foreach ($permissionKeysPerDefaultRole as $permissionKey) {
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
