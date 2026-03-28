<?php

use App\Shared\Http\ApiResponse;
use App\Modules\Workspace\Http\Controllers\WorkspaceController;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->prefix('workspaces')->group(function () {
    Route::get('/', [WorkspaceController::class, 'listUserWorkspaces']);
    Route::post('/', [WorkspaceController::class, 'create']);
    // Route::get('/{workspace}', [WorkspaceController::class, 'show']);
    // Route::get('/{workspace}/members', [WorkspaceController::class, 'members']);
    // Route::post('/{workspace}/members', [WorkspaceController::class, 'addMember']);
});

Route::middleware(['auth:api', 'workspace.context'])->get('/_test/workspace-context', function (Request $request, WorkspaceContextService $workspaceContext) {
    return ApiResponse::success(
        message: 'Workspace context resolved successfully.',
        data: [
            'context' => $workspaceContext->context(),
            'request_workspace_id' => $workspaceContext->currentWorkspaceId(),
        ]
    );
});
