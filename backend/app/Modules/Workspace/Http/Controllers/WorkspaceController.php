<?php

namespace App\Modules\Workspace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Actions\WorkspaceActions\DeleteCurrentWorkspace;
use App\Modules\Workspace\Actions\WorkspaceActions\LeaveCurrentWorkspace;
use App\Modules\Workspace\Actions\WorkspaceActions\ListUserWorkspaces;
use App\Modules\Workspace\Actions\WorkspaceActions\RestoreWorkspace;
use App\Modules\Workspace\Actions\WorkspaceActions\ShowCurrentWorkspace;
use App\Modules\Workspace\Actions\WorkspaceActions\UpdateCurrentWorkspace;
use App\Modules\Workspace\Http\Requests\CreateWorkspaceRequest;
use App\Modules\Workspace\Http\Requests\LeaveCurrentWorkspaceRequest;
use App\Modules\Workspace\Http\Requests\UpdateWorkspaceRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    // WorkspaceController.php handles the workspace itself:
    // create workspace
    // list my workspaces
    // show current workspace
    // update current workspace
    // delete current workspace
    // restore archived workspace
    // leave current workspace

    public function create(CreateWorkspaceRequest $request, CreateWorkspace $action): JsonResponse
    {
        $workspace = $action->execute(
            data: $request->validated(),
            user: $request->user()
        );

        return ApiResponse::success(
            message: 'Workspace created successfully.',
            data: ['workspace' => $workspace],
            status: 201
        );
    }

    public function listUserWorkspaces(Request $request, ListUserWorkspaces $action): JsonResponse
    {
        $workspaces = $action->execute($request->user());

        return ApiResponse::success(
            message: 'Workspace retrieved successfully.',
            data: [
                'count' => count($workspaces),
                'workspaces' => $workspaces,
            ]
        );
    }

    public function showCurrent(ShowCurrentWorkspace $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace retrieved successfully.',
            data: $action->execute()
        );
    }

    public function updateCurrent(UpdateWorkspaceRequest $request, UpdateCurrentWorkspace $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace update endpoint scaffolded. Logic not implemented yet.',
            data: $action->execute($request->validated(), $request->user())
        );
    }

    public function deleteCurrent(Request $request, DeleteCurrentWorkspace $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace archived successfully.',
            data: $action->execute($request->user())
        );
    }

    public function restore(Request $request, int $workspace, RestoreWorkspace $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace restored successfully.',
            data: $action->execute($workspace, $request->user())
        );
    }

    public function leaveCurrent(LeaveCurrentWorkspaceRequest $request, LeaveCurrentWorkspace $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace leave processed successfully.',
            data: $action->execute($request->user(), $request->validated())
        );
    }

    // public function removeMember() {}
}
