<?php

use App\Modules\RolesPermissions\Http\Controllers\RolesPermissionsController;
use Illuminate\Support\Facades\Route;

// Roles & Permissions routes
//
// /permissions:
// - global data
// - does not depend on current workspace
//
// /roles and /defaults/sync:
// - workspace-specific data
// - depend on workspace.context middleware
Route::prefix('roles-permissions')->middleware('auth:api')->group(function () {
    Route::get('/permissions', [RolesPermissionsController::class, 'permissions']);

    Route::middleware('workspace.context')->group(function () {
        Route::get('/roles', [RolesPermissionsController::class, 'roles'])
            ->middleware('hasPermission:role.view');

        Route::post('/roles', [RolesPermissionsController::class, 'createRole'])
            ->middleware('hasPermission:role.create');

        Route::get('/roles/{roleId}', [RolesPermissionsController::class, 'showRole'])
            ->whereNumber('roleId')
            ->middleware('hasPermission:role.view');

        Route::patch('/roles/{roleId}', [RolesPermissionsController::class, 'updateRole'])
            ->whereNumber('roleId')
            ->middleware('hasPermission:role.update');

        Route::delete('/roles/{roleId}', [RolesPermissionsController::class, 'deleteRole'])
            ->whereNumber('roleId')
            ->middleware('hasPermission:role.delete');


            // https://chatgpt.com/c/69d92a4c-0118-8325-bbda-98acb49122d5
            // Continue Tomorrow form here
        Route::put('/roles/{roleId}/permissions', [RolesPermissionsController::class, 'updateRolePermissions'])
            ->whereNumber('roleId')
            ->middleware('hasPermission:role.assign');
 
        Route::post('/defaults/sync', [RolesPermissionsController::class, 'syncDefaults'])
            ->middleware('hasPermission:role.update');
    });
});
