<?php

namespace App\Modules\RolesPermissions\Services;

use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\RolePermission;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class PermissionCatalogService
{
    private const PERMISSION_MATRIX = [
        'workspace' => ['view', 'update', 'delete'],
        'member' => ['view', 'invite', 'update', 'remove'],
        'role' => ['view', 'create', 'update', 'delete', 'assign'],
        'project' => ['view', 'create', 'update', 'delete', 'archive'],
        'task' => ['view', 'create', 'update', 'delete', 'assign', 'change_status'],
        'comment' => ['view', 'create', 'update', 'delete', 'moderate'],
        'audit' => ['view', 'export'],
        'report' => ['view', 'create', 'export'],
    ];

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

    private const ACTION_LABELS = [
        'view' => 'View',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
        'invite' => 'Invite',
        'remove' => 'Remove',
        'assign' => 'Assign',
        'archive' => 'Archive',
        'moderate' => 'Moderate',
        'export' => 'Export',
        'change_status' => 'Change',
    ];

    private const DEFAULT_ROLE_KEYS = [
        'owner' => [
            'name' => 'Owner',
            'description' => 'Full control over the workspace and all its resources.',
        ],
        'admin' => [
            'name' => 'Admin',
            'description' => 'Manage workspace settings, members, roles, projects, tasks, comments, audits, and reports.',
        ],
        'member' => [
            'name' => 'Member',
            'description' => 'Collaborate on workspace projects, tasks, comments, and reports.',
        ],
    ];

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

    public function definitions(): array
    {
        return collect(self::PERMISSION_MATRIX)
            ->flatMap(function (array $actions, string $resource): array {
                return array_map(function (string $action) use ($resource): array {
                    $key = "{$resource}.{$action}";

                    return [
                        'key' => $key,
                        'name' => $this->permissionName($resource, $action),
                        'description' => $this->permissionDescription($resource, $action),
                    ];
                }, $actions);
            })
            ->sortBy('key')
            ->values()
            ->all();
    }

    public function defaultRoleDefinitions(): array
    {
        $allPermissionKeys = $this->permissionKeys();
        $adminPermissionKeys = array_values(array_filter(
            $allPermissionKeys,
            fn (string $key): bool => $key !== 'workspace.delete'
        ));

        return [
            [
                'key' => 'owner',
                'name' => self::DEFAULT_ROLE_KEYS['owner']['name'],
                'description' => self::DEFAULT_ROLE_KEYS['owner']['description'],
                'permissions' => $allPermissionKeys,
            ],
            [
                'key' => 'admin',
                'name' => self::DEFAULT_ROLE_KEYS['admin']['name'],
                'description' => self::DEFAULT_ROLE_KEYS['admin']['description'],
                'permissions' => $adminPermissionKeys,
            ],
            [
                'key' => 'member',
                'name' => self::DEFAULT_ROLE_KEYS['member']['name'],
                'description' => self::DEFAULT_ROLE_KEYS['member']['description'],
                'permissions' => self::MEMBER_PERMISSION_KEYS,
            ],
        ];
    }

    public function permissionKeys(): array
    {
        return array_column($this->definitions(), 'key');
    }

    public function expandLegacyPermissionKey(string $key): array
    {
        if (!str_ends_with($key, '.*')) {
            return in_array($key, $this->permissionKeys(), true) ? [$key] : [];
        }

        $resource = explode('.', $key)[0];
        $actions = self::PERMISSION_MATRIX[$resource] ?? [];

        return array_map(
            fn (string $action): string => "{$resource}.{$action}",
            $actions
        );
    }

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
        }

        $this->migrateLegacyRolePermissions(collect($permissions));
        $this->purgeLegacyWildcardPermissions();

        return collect($permissions);
    }

    private function migrateLegacyRolePermissions(Collection $permissionsByKey): void
    {
        $legacyRolePermissions = RolePermission::query()
            ->with('permission:id,key')
            ->get();

        foreach ($legacyRolePermissions as $rolePermission) {
            $legacyKey = $rolePermission->permission_key;

            if ($legacyKey === null && $rolePermission->permission) {
                $legacyKey = $rolePermission->permission->key;
            }

            if ($legacyKey === null || !str_ends_with($legacyKey, '.*')) {
                continue;
            }

            foreach ($this->expandLegacyPermissionKey($legacyKey) as $expandedKey) {
                $permission = $permissionsByKey->get($expandedKey);

                if (!$permission) {
                    continue;
                }

                RolePermission::query()->updateOrCreate(
                    [
                        'role_id' => $rolePermission->role_id,
                        'permission_id' => $permission->id,
                    ],
                    [
                        'permission_key' => $permission->key,
                    ]
                );
            }
        }
    }

    private function purgeLegacyWildcardPermissions(): void
    {
        RolePermission::query()
            ->where('permission_key', 'like', '%.*')
            ->delete();

        $legacyPermissionIds = Permission::query()
            ->where('key', 'like', '%.*')
            ->pluck('id');

        if ($legacyPermissionIds->isNotEmpty()) {
            RolePermission::query()
                ->whereIn('permission_id', $legacyPermissionIds)
                ->delete();
        }

        Permission::query()
            ->where('key', 'like', '%.*')
            ->delete();
    }

    private function permissionName(string $resource, string $action): string
    {
        if ($action === 'change_status') {
            return 'Change task status';
        }

        return self::ACTION_LABELS[$action].' '.self::RESOURCE_LABELS[$resource];
    }

    private function permissionDescription(string $resource, string $action): string
    {
        $label = Arr::get(self::RESOURCE_LABELS, $resource, $resource);

        if ($action === 'change_status') {
            return 'Allows the user to change task status within the workspace.';
        }

        return sprintf(
            'Allows the user to %s %s within the workspace.',
            strtolower(self::ACTION_LABELS[$action]),
            $label
        );
    }
}
