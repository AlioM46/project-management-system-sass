<?php

namespace App\Modules\RolesPermissions\Services;

use App\Modules\RolesPermissions\Model\Permission;
use Illuminate\Support\Collection;

class PermissionCatalogService
{
    public const RESERVED_ROLE_SLUGS = ['owner', 'admin', 'member'];
    public const RESERVED_ROLE_NAMES = ['Owner', 'Admin', 'Member'];

    private const PERMISSION_MATRIX = [
        'workspace' => ['view', 'update', 'delete'],
        'member' => ['view', 'invite', 'update', 'remove'],
        'role' => ['view', 'create', 'update', 'delete', 'assign'],
        'course' => ['view', 'create', 'update', 'delete', 'archive', 'restore'],
        'lead' => ['view', 'create', 'update', 'delete', 'assign', 'change_stage'],
        'comment' => ['view', 'create', 'update', 'delete', 'moderate'],
        'audit' => ['view', 'export'],
        'report' => ['view', 'create', 'export'],
    ];

    private const RESOURCE_LABELS = [
        'workspace' => 'workspace',
        'member' => 'members',
        'role' => 'roles',
        'course' => 'courses',
        'lead' => 'leads',
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
        'restore' => 'Restore',
        'moderate' => 'Moderate',
        'export' => 'Export',
        'change_stage' => 'Change',
    ];

    private const DEFAULT_ROLE_KEYS = [
        'owner' => ['slug' => 'owner', 'name' => 'Owner', 'description' => 'Full control over the workspace and all its resources.'],
        'admin' => ['slug' => 'admin', 'name' => 'Admin', 'description' => 'Manage workspace settings, members, roles, courses, leads, comments, audits, and reports.'],
        'member' => ['slug' => 'member', 'name' => 'Member', 'description' => 'Collaborate on workspace courses, leads, comments, and reports.'],
    ];

    private const MEMBER_PERMISSION_KEYS = [
        'workspace.view',
        'member.view',
        'role.view',
        'course.view',
        'course.create',
        'course.update',
        'lead.view',
        'lead.create',
        'lead.update',
        'lead.change_stage',
        'comment.view',
        'comment.create',
        'comment.update',
        'report.view',
    ];

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

    public function defaultRoleDefinitions(): array
    {
        $allPermissionKeys = $this->permissionKeys();
        $adminPermissionKeys = array_values(array_filter(
            $allPermissionKeys,
            fn (string $key): bool => $key !== 'workspace.delete'
        ));

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

    public function permissionKeys(): array
    {
        return array_column($this->definitions(), 'key');
    }

    public function syncSystemPermissions(): Collection
    {
        $permissions = [];

        foreach ($this->definitions() as $definition) {
            $permission = Permission::query()->updateOrCreate(
                ['key' => $definition['key']],
                ['name' => $definition['name'], 'description' => $definition['description']]
            );

            $permissions[$permission->key] = $permission;
        }

        return collect($permissions);
    }

    private function permissionName(string $resource, string $action): string
    {
        if ($action === 'change_stage') {
            return 'Change lead stage';
        }

        return self::ACTION_LABELS[$action].' '.$this->resourceLabel($resource);
    }

    private function permissionDescription(string $resource, string $action): string
    {
        if ($action === 'change_stage') {
            return 'Allows the user to change lead stage within the workspace.';
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
