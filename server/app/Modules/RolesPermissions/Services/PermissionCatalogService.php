<?php

namespace App\Modules\RolesPermissions\Services;

use App\Modules\RolesPermissions\Model\Permission;
use Illuminate\Support\Collection;

/**
 * Central source of truth for Roles & Permissions.
 *
 * What this service owns:
 * - the list of system permissions
 * - the default workspace roles
 * - syncing the permission catalog into the database
 *
 * What this service does NOT own:
 * - creating workspace roles for a specific workspace
 * - assigning the creator to the owner role
 */
class PermissionCatalogService
{
    public const RESERVED_ROLE_SLUGS = [
        'owner',
        'admin',
        'member',
    ];

    public const RESERVED_ROLE_NAMES = [
        'Owner',
        'Admin',
        'Member',
    ];

    /**
     * Permission matrix grouped by resource.
     *
     * Example:
     * - "task" => ["view", "create", "assign"]
     *
     * Resulting permission keys:
     * - task.view
     * - task.create
     * - task.assign
     */
    private const PERMISSION_MATRIX = [
        'workspace' => ['view', 'update', 'delete'],
        'member' => ['view', 'invite', 'update', 'remove'],
        'role' => ['view', 'create', 'update', 'delete', 'assign'],
        'project' => ['view', 'create', 'update', 'delete', 'archive', 'restore'],
        'task' => ['view', 'create', 'update', 'delete', 'assign', 'change_status'],
        'comment' => ['view', 'create', 'update', 'delete', 'moderate'],
        'audit' => ['view', 'export'],
        'report' => ['view', 'create', 'export'],
    ];

    /**
     * Human labels used in generated names/descriptions.
     *
     * Example:
     * - resource "audit" becomes "audit logs"
     * - permission name becomes "View audit logs"
     */
    private const RESOURCE_LABELS = [
        'workspace' => 'workspace',
        'member' => 'members',
        'role' => 'roles',
        'project' => 'projects',
        'task' => 'tasks',
        'comment' => 'comments',
        'audit' => 'audit logs',
        'report' => 'reports',
    ];

    /**
     * Human verbs used in generated names/descriptions.
     *
     * Example:
     * - action "assign" becomes "Assign"
     * - permission name becomes "Assign tasks"
     */
    private const ACTION_LABELS = [
        'view' => 'View',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
        'invite' => 'Invite',
        'remove' => 'Remove',
        'assign' => 'Assign',
        'archive' => 'Archive',
        'restore' => 'Restore',
        'moderate' => 'Moderate',
        'export' => 'Export',
        'change_status' => 'Change',
    ];

    /**
     * Metadata for the default system roles.
     *
     * The permission list for each role is built later in defaultRoleDefinitions().
     */
    private const DEFAULT_ROLE_KEYS = [
        'owner' => [
            'slug' => 'owner',
            'name' => 'Owner',
            'description' => 'Full control over the workspace and all its resources.',
        ],
        'admin' => [
            'slug' => 'admin',
            'name' => 'Admin',
            'description' => 'Manage workspace settings, members, roles, projects, tasks, comments, audits, and reports.',
        ],
        'member' => [
            'slug' => 'member',
            'name' => 'Member',
            'description' => 'Collaborate on workspace projects, tasks, comments, and reports.',
        ],
    ];

    /**
     * Member is intentionally restricted to collaboration-level permissions.
     *
     * Result example:
     * - can view workspace
     * - can work on projects/tasks/comments
     * - cannot delete workspace
     * - cannot manage roles or members
     */
    private const MEMBER_PERMISSION_KEYS = [
        'workspace.view',
        'member.view',
        'role.view',
        'project.view',
        'project.create',
        'project.update',
        'task.view',
        'task.create',
        'task.update',
        'task.change_status',
        'comment.view',
        'comment.create',
        'comment.update',
        'report.view',
    ];

    /**
     * Build the full permission catalog from the matrix above.
     *
     * When it is used:
     * - before syncing permissions to the database
     * - when another class needs to know all available system permissions
     *
     * Why it exists:
     * - to keep one source of truth for permission definitions
     *
     * Result example:
     * [
     *   ['key' => 'audit.export', 'name' => 'Export audit logs', ...],
     *   ['key' => 'audit.view', 'name' => 'View audit logs', ...],
     *   ['key' => 'comment.create', 'name' => 'Create comments', ...],
     * ]
     */
    public function definitions(): array
    {
        $definitions = [];

        foreach (self::PERMISSION_MATRIX as $resource => $actions) {
            foreach ($actions as $action) {
                $definitions[] = $this->buildPermissionDefinition($resource, $action);
            }
        }

        usort($definitions, fn (array $left, array $right): int => $left['key'] <=> $right['key']);

        return $definitions;
    }

    /**
     * Build the default workspace roles with their permission keys.
     *
     * When it is used:
     * - when provisioning default roles for a workspace
     *
     * Why it exists:
     * - to keep role templates in one place
     *
     * Result example:
     * [
     *   ['key' => 'owner', 'name' => 'Owner', 'permissions' => ['workspace.view', ...]],
     *   ['key' => 'admin', 'name' => 'Admin', 'permissions' => ['workspace.view', ...]],
     *   ['key' => 'member', 'name' => 'Member', 'permissions' => ['workspace.view', ...]],
     * ]
     */
    public function defaultRoleDefinitions(): array
    {
        // 1. Owner Permissions: all permissions
        $allPermissionKeys = $this->permissionKeys();
        // 2. Admin Permissions: all except workspace.delete
        $adminPermissionKeys = array_values(array_filter(
            $allPermissionKeys,
            fn (string $key): bool => $key !== 'workspace.delete'
        ));

        // 3. Member Permissions: defined in MEMBER_PERMISSION_KEYS constant
        return [
            $this->buildRoleDefinition('owner', $allPermissionKeys),
            $this->buildRoleDefinition('admin', $adminPermissionKeys),
            $this->buildRoleDefinition('member', self::MEMBER_PERMISSION_KEYS),
        ];
    }

    public function reservedRoleSlugs(): array
    {
        return self::RESERVED_ROLE_SLUGS;
    }

    public function reservedRoleNames(): array
    {
        return self::RESERVED_ROLE_NAMES;
    }

    public function isReservedRoleSlug(string $slug): bool
    {
        return in_array(strtolower($slug), self::RESERVED_ROLE_SLUGS, true);
    }

    public function isReservedRoleName(string $name): bool
    {
        return in_array(strtolower($name), array_map('strtolower', self::RESERVED_ROLE_NAMES), true);
    }

    /**
     * Return only the permission keys from definitions().
     *
     * Result example:
     * ['audit.export', 'audit.view', 'comment.create', ...]
     */
    public function permissionKeys(): array
    {
        return array_column($this->definitions(), 'key');
    }

    /**
     * Sync the system permission catalog into the permissions table.
     *
     * When it is used:
     * - before listing permissions
     * - before provisioning workspace roles
     *
     * Why it exists:
     * - to guarantee the permissions table always contains the system catalog
     *
     * Result:
     * - database rows are inserted/updated
     * - returns a collection keyed by permission key
     *
     * Result example:
     * collect([
     *   'task.assign' => Permission {...},
     *   'workspace.view' => Permission {...},
     * ])
     */
    public function syncSystemPermissions(): Collection
    {
        $permissions = [];

        foreach ($this->definitions() as $definition) {
            $permission = Permission::query()->updateOrCreate(
                ['key' => $definition['key']],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                ]
            );

            $permissions[$permission->key] = $permission;
            /* EG:
             * 'workspace.view' => Permission { id: 10, key: 'workspace.view', name: 'View workspace', description: 'Allows the user to view the workspace and its contents.' }
             * 'workspace.view' => Permission { id: 10, key: 'workspace.view', name: 'View workspace', description: 'Allows the user to view the workspace and its contents.' }
             *
             */
        }

        return collect($permissions);
    }

    private function permissionName(string $resource, string $action): string
    {
        if ($action === 'change_status') {
            return 'Change task status';
        }

        return self::ACTION_LABELS[$action].' '.$this->resourceLabel($resource);
    }

    private function permissionDescription(string $resource, string $action): string
    {
        if ($action === 'change_status') {
            return 'Allows the user to change task status within the workspace.';
        }

        return sprintf(
            'Allows the user to %s %s within the workspace.',
            strtolower(self::ACTION_LABELS[$action]),
            $this->resourceLabel($resource)
        );
    }

    private function buildPermissionDefinition(string $resource, string $action): array
    {
        return [
            'key' => "{$resource}.{$action}",
            'name' => $this->permissionName($resource, $action),
            'description' => $this->permissionDescription($resource, $action),
        ];
    }

    private function buildRoleDefinition(string $roleKey, array $permissions): array
    {
        return [
            'key' => $roleKey,
            'slug' => self::DEFAULT_ROLE_KEYS[$roleKey]['slug'],
            'name' => self::DEFAULT_ROLE_KEYS[$roleKey]['name'],
            'description' => self::DEFAULT_ROLE_KEYS[$roleKey]['description'],
            'is_system' => true,
            'is_editable' => false,
            'is_deletable' => false,
            'permissions' => $permissions,
        ];
    }

    private function resourceLabel(string $resource): string
    {
        return self::RESOURCE_LABELS[$resource] ?? $resource;
    }
}
