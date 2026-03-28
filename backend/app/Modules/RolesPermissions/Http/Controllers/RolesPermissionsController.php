<?php

namespace App\Modules\RolesPermissions\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Actions\ListWorkspaceRoles;
use App\Modules\RolesPermissions\Actions\SyncWorkspaceDefaults;
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
}
