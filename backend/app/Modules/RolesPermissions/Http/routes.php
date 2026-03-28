<?php

use App\Modules\RolesPermissions\Http\Controllers\RolesPermissionsController;
use Illuminate\Support\Facades\Route;

Route::prefix('roles-permissions')->middleware('auth:api')->group(function () {
    Route::get('/permissions', [RolesPermissionsController::class, 'permissions']);

    Route::middleware('workspace.context')->group(function () {
        Route::get('/roles', [RolesPermissionsController::class, 'roles']);
        Route::post('/defaults/sync', [RolesPermissionsController::class, 'syncDefaults']);
    });
});
