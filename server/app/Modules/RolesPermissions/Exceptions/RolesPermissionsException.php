<?php

namespace App\Modules\RolesPermissions\Exceptions;

use App\Shared\Exceptions\BusinessException;

class RolesPermissionsException extends BusinessException
{
    public static function roleNotFound(int $roleId, int $workspaceId): self
    {
        return new self(
            message: 'The selected role is invalid for this workspace.',
            errorCode: 'ROLE_NOT_FOUND',
            status: 404,
            meta: [
                'role_id' => $roleId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function reservedRoleName(string $name): self
    {
        return new self(
            message: 'Reserved system role names cannot be used for custom roles.',
            errorCode: 'ROLE_RESERVED_NAME',
            status: 422,
            meta: ['name' => $name]
        );
    }

    public static function reservedRoleSlug(string $slug): self
    {
        return new self(
            message: 'Reserved system role slugs cannot be used for custom roles.',
            errorCode: 'ROLE_RESERVED_SLUG',
            status: 422,
            meta: ['slug' => $slug]
        );
    }

    public static function systemRoleNotEditable(int $roleId, int $workspaceId): self
    {
        return new self(
            message: 'Built-in system roles cannot be updated through this endpoint.',
            errorCode: 'ROLE_SYSTEM_NOT_EDITABLE',
            status: 422,
            meta: [
                'role_id' => $roleId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function systemRoleNotDeletable(int $roleId, int $workspaceId): self
    {
        return new self(
            message: 'Built-in system roles cannot be deleted.',
            errorCode: 'ROLE_SYSTEM_NOT_DELETABLE',
            status: 422,
            meta: [
                'role_id' => $roleId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function roleStillAssigned(int $roleId, int $workspaceId, int $memberCount): self
    {
        return new self(
            message: 'This role is still assigned to workspace members and cannot be deleted.',
            errorCode: 'ROLE_STILL_ASSIGNED',
            status: 409,
            meta: [
                'role_id' => $roleId,
                'workspace_id' => $workspaceId,
                'member_count' => $memberCount,
            ]
        );
    }

    public static function invalidPermissionKeys(array $permissionKeys): self
    {
        return new self(
            message: 'One or more permission keys are invalid.',
            errorCode: 'ROLE_INVALID_PERMISSIONS',
            status: 422,
            meta: ['permission_keys' => array_values($permissionKeys)]
        );
    }

    public static function permissionGrantForbidden(array $permissionKeys, int $workspaceId): self
    {
        return new self(
            message: 'You cannot grant one or more of the selected permissions.',
            errorCode: 'ROLE_PERMISSION_GRANT_FORBIDDEN',
            status: 403,
            meta: [
                'permission_keys' => array_values($permissionKeys),
                'workspace_id' => $workspaceId,
            ]
        );
    }
}
