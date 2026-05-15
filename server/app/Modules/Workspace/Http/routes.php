<?php

use App\Modules\Workspace\Http\Controllers\DashboardController;
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

    Route::post('/members/accept-invite', [WorkspaceMemberController::class, 'acceptInvite'])
        ->name('workspaces.members.invite.accept');

    // The workspace-specific endpoints below depend on X-Workspace-Id.
    Route::middleware('workspace.context')->group(function () {
        Route::get('/dashboard/summary', [DashboardController::class, 'summary'])
            ->name('workspaces.dashboard.summary')
            ->middleware('hasPermission:workspace.view');

        Route::get('/current', [WorkspaceController::class, 'showCurrent'])
            ->name('workspaces.current.show')
            ->middleware('hasPermission:workspace.view');

        Route::patch('/current', [WorkspaceController::class, 'updateCurrent'])
            ->name('workspaces.current.update')
            ->middleware('hasPermission:workspace.update');

        Route::delete('/current', [WorkspaceController::class, 'deleteCurrent'])
            ->name('workspaces.current.destroy')
            ->middleware('hasPermission:workspace.delete');

        // under Test......
        Route::post('/current/leave', [WorkspaceController::class, 'leaveCurrent'])
            ->name('workspaces.current.leave');

        // WorkspaceMemberController routes

        Route::get('/members/{member}', [WorkspaceMemberController::class, 'showMember'])
            ->whereNumber('member')
            ->name('workspaces.members.show')
            ->middleware('hasPermission:member.view');

        Route::get('/members', [WorkspaceMemberController::class, 'members'])
            ->name('workspaces.members.index')
            ->middleware('hasPermission:member.view');

        Route::post('/members/send-invite', [WorkspaceMemberController::class, 'sendInvite'])
            ->name('workspaces.members.invite')
            ->middleware('hasPermission:member.invite');

        Route::patch('/members/{member}', [WorkspaceMemberController::class, 'changeMemberRole'])
            ->whereNumber('member')
            ->name('workspaces.members.changeMemberRole')
            ->middleware('hasPermission:member.update');

        Route::delete('/members/{member}', [WorkspaceMemberController::class, 'remove'])
            ->whereNumber('member')
            ->name('workspaces.members.destroy')
            ->middleware('hasPermission:member.remove');
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
