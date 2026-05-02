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
        return ApiResponse::success(
            message: 'Permissions retrieved successfully.',
            data: ['permissions' => $action->execute()]
        );
    }

    /**
     * Return roles for the active workspace.
     */
    public function roles(ListWorkspaceRoles $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Roles retrieved successfully.',
            data: ['roles' => $action->execute()]
        );
    }

    public function createRole(CreateWorkspaceRoleRequest $request, CreateWorkspaceRole $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace role created successfully.',
            data: ['role' => $action->execute($request->validated(), $request->user())['role']],
            status: 201
        );
    }

    public function showRole(int $roleId, ShowWorkspaceRole $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Role retrieved successfully.',
            data: ['role' => $action->execute($roleId)['role']]
        );
    }

    public function updateRole(int $roleId, UpdateWorkspaceRoleRequest $request, UpdateWorkspaceRole $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace role updated successfully.',
            data: ['role' => $action->execute($roleId, $request->validated(), $request->user())['role']]
        );
    }

    public function deleteRole(int $roleId, DeleteWorkspaceRole $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace role deleted successfully.',
            data: ['role' => $action->execute($roleId, request()->user())['role']]
        );
    }

    public function updateRolePermissions(
        int $roleId,
        UpdateWorkspaceRolePermissionsRequest $request,
        UpdateWorkspaceRolePermissions $action
    ): JsonResponse {
        return ApiResponse::success(
            message: 'Role permissions updated successfully.',
            data: ['role' => $action->execute($roleId, $request->validated(), $request->user())['role']]
        );
    }

    /**
     * Re-apply the default system roles for the active workspace.
     */
    public function syncDefaults(SyncWorkspaceDefaults $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace default roles synchronized successfully.',
            data: ['roles' => $action->execute()]
        );
    }
}
