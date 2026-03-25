<?php

use App\Modules\Workspace\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->prefix('workspaces')->group(function () {
    Route::get('/', [WorkspaceController::class, 'index']);
    Route::post('/', [WorkspaceController::class, 'store']);
    Route::get('/{workspace}', [WorkspaceController::class, 'show']);
    Route::get('/{workspace}/members', [WorkspaceController::class, 'members']);
    Route::post('/{workspace}/members', [WorkspaceController::class, 'addMember']);
});
