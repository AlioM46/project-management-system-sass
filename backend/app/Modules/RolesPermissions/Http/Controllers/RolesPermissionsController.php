<?php

namespace App\Modules\RolesPermissions\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Actions\ListWorkspaceRoles;
use App\Modules\RolesPermissions\Actions\SyncWorkspaceDefaults;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class RolesPermissionsController extends Controller
{
    public function permissions(ListPermissions $action): JsonResponse
    {
        $permissions = $action->execute();

        return ApiResponse::success(
            message: 'Permissions retrieved successfully.',
            data: ['permissions' => $permissions]
        );
    }

    public function roles(ListWorkspaceRoles $action): JsonResponse
    {
        $roles = $action->execute();

        return ApiResponse::success(
            message: 'Roles retrieved successfully.',
            data: ['roles' => $roles]
        );
    }

    public function syncDefaults(SyncWorkspaceDefaults $action): JsonResponse
    {
        $roles = $action->execute();

        return ApiResponse::success(
            message: 'Workspace default roles synchronized successfully.',
            data: ['roles' => $roles]
        );
    }
}
