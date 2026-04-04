<?php

use App\Modules\Workspace\Http\Controllers\WorkspaceController;
use App\Modules\Workspace\Http\Controllers\WorkspaceMemberController;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->prefix('workspaces')->group(function () {
    Route::get('/', [WorkspaceController::class, 'listUserWorkspaces'])
        ->name('workspaces.index');

    Route::post('/', [WorkspaceController::class, 'create'])
        ->name('workspaces.store');

    Route::post('/{workspace}/restore', [WorkspaceController::class, 'restore'])
        ->whereNumber('workspace')
        ->name('workspaces.restore');

    // The workspace-specific endpoints below depend on X-Workspace-Id.
    Route::middleware('workspace.context')->group(function () {
        Route::get('/current', [WorkspaceController::class, 'showCurrent'])
            ->name('workspaces.current.show');

        Route::patch('/current', [WorkspaceController::class, 'updateCurrent'])
            ->name('workspaces.current.update');

        Route::delete('/current', [WorkspaceController::class, 'deleteCurrent'])
            ->name('workspaces.current.destroy');

// under Test......
        Route::post('/current/leave', [WorkspaceController::class, 'leaveCurrent'])
            ->name('workspaces.current.leave');

            // WorkspaceMemberController routes

        Route::get('/members', [WorkspaceMemberController::class, 'members'])
            ->name('workspaces.members.index');

        Route::post('/members/send-invite', [WorkspaceMemberController::class, 'sendInvite'])
            ->name('workspaces.members.invite');

                    
        Route::post('/members/accept-invite', [WorkspaceMemberController::class, 'sendInvite'])
            ->name('workspaces.members.invite');

        Route::patch('/members/{member}', [WorkspaceMemberController::class, 'update'])
            ->name('workspaces.members.update');

        Route::delete('/members/{member}', [WorkspaceMemberController::class, 'remove'])
            ->name('workspaces.members.destroy');
    });
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
