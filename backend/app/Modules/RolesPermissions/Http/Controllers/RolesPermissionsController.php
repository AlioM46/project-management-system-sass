<?php

namespace App\Modules\RolesPermissions\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\RolesPermissions\Actions\CreateWorkspaceRole;
use App\Modules\RolesPermissions\Actions\DeleteWorkspaceRole;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Actions\ListWorkspaceRoles;
use App\Modules\RolesPermissions\Actions\ShowWorkspaceRole;
use App\Modules\RolesPermissions\Actions\SyncWorkspaceDefaults;
use App\Modules\RolesPermissions\Actions\UpdateWorkspaceRole;
use App\Modules\RolesPermissions\Actions\UpdateWorkspaceRolePermissions;
use App\Modules\RolesPermissions\Http\Requests\CreateWorkspaceRoleRequest;
use App\Modules\RolesPermissions\Http\Requests\UpdateWorkspaceRolePermissionsRequest;
use App\Modules\RolesPermissions\Http\Requests\UpdateWorkspaceRoleRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Thin HTTP layer for Roles & Permissions.
 *
 * Pattern:
 * route -> controller -> action -> service/model -> response
 */
class RolesPermissionsController extends Controller
{
    /**
     * Return the global permission catalog.
     */
    public function permissions(ListPermissions $action): JsonResponse
    {
        return $this->respondWithCollection(
            message: 'Permissions retrieved successfully.',
            key: 'permissions',
            items: $action->execute()
        );
    }

    /**
     * Return roles for the active workspace.
     */
    public function roles(ListWorkspaceRoles $action): JsonResponse
    {
        return $this->respondWithCollection(
            message: 'Roles retrieved successfully.',
            key: 'roles',
            items: $action->execute()
        );
    }

    public function createRole(CreateWorkspaceRoleRequest $request, CreateWorkspaceRole $action): JsonResponse
    {
        return $this->respondWithItem(
            message: 'Workspace role created successfully.',
            key: 'role',
            item: $action->execute($request->validated())['role'],
            status: 201
        );
    }

    public function showRole(int $roleId, ShowWorkspaceRole $action): JsonResponse
    {
        return $this->respondWithItem(
            message: 'Role retrieved successfully.',
            key: 'role',
            item: $action->execute($roleId)['role']
        );
    }

    public function updateRole(int $roleId, UpdateWorkspaceRoleRequest $request, UpdateWorkspaceRole $action): JsonResponse
    {
        return $this->respondWithItem(
            message: 'Workspace role updated successfully.',
            key: 'role',
            item: $action->execute($roleId, $request->validated())['role']
        );
    }

    public function deleteRole(int $roleId, DeleteWorkspaceRole $action): JsonResponse
    {
        return $this->respondWithItem(
            message: 'Workspace role deleted successfully.',
            key: 'role',
            item: $action->execute($roleId)['role']
        );
    }

    public function updateRolePermissions(
        int $roleId,
        UpdateWorkspaceRolePermissionsRequest $request,
        UpdateWorkspaceRolePermissions $action
    ): JsonResponse {
        return $this->respondWithItem(
            message: 'Role permissions updated successfully.',
            key: 'role',
            item: $action->execute($roleId, $request->validated(), $request->user())['role']
        );
    }

    /**
     * Re-apply the default system roles for the active workspace.
     */
    public function syncDefaults(SyncWorkspaceDefaults $action): JsonResponse
    {
        return $this->respondWithCollection(
            message: 'Workspace default roles synchronized successfully.',
            key: 'roles',
            items: $action->execute()
        );
    }

    /**
     * Shared success response builder.
     *
     * Result example:
     * {
     *   "success": true,
     *   "message": "Roles retrieved successfully.",
     *   "data": { "roles": [...] }
     * }
     */
    private function respondWithCollection(string $message, string $key, mixed $items): JsonResponse
    {
        return ApiResponse::success(
            message: $message,
            data: [$key => $items]
        );
    }

    private function respondWithItem(string $message, string $key, mixed $item, int $status = 200): JsonResponse
    {
        return ApiResponse::success(
            message: $message,
            data: [$key => $item],
            status: $status
        );
    }
}
