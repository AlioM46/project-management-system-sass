<?php

namespace App\Modules\Workspace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Workspace\Actions\CreateWorkspace;
use App\Modules\Workspace\Http\Requests\CreateWorkspaceRequest;
use App\Modules\Workspace\Http\Requests\StoreWorkspaceMemberRequest;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Shared\Http\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaces = Workspace::query()
            ->accessibleTo($request->user()->id)
            ->with(['owner:id,name,email'])
            ->withCount('members')
            ->orderByDesc('updated_at')
            ->get();

        return ApiResponse::success(
            message: 'Workspaces retrieved successfully.',
            data: ['workspaces' => $workspaces],
            status: 200
        );
    }

    public function store(CreateWorkspaceRequest $request, CreateWorkspace $action): JsonResponse
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

    public function show(Workspace $workspace, Request $request): JsonResponse
    {
        $this->ensureWorkspaceAccess($workspace, $request->user()->id);

        $workspace->load([
            'owner:id,name,email',
            'members.user:id,name,email',
        ])->loadCount('members');

        return ApiResponse::success(
            message: 'Workspace retrieved successfully.',
            data: ['workspace' => $workspace],
            status: 200
        );
    }

    public function members(Workspace $workspace, Request $request): JsonResponse
    {
        $this->ensureWorkspaceAccess($workspace, $request->user()->id);

        $members = $workspace->members()
            ->with('user:id,name,email')
            ->orderByDesc('joined_at')
            ->get();

        return ApiResponse::success(
            message: 'Workspace members retrieved successfully.',
            data: ['members' => $members],
            status: 200
        );
    }

    public function addMember(
        Workspace $workspace,
        StoreWorkspaceMemberRequest $request
    ): JsonResponse {
        $this->ensureWorkspaceManagement($workspace, $request->user()->id);

        $payload = $request->validated();

        $member = Workspace_Members::query()->firstOrNew([
            'workspace_id' => $workspace->id,
            'user_id' => $payload['user_id'],
        ]);

        if (array_key_exists('role_id', $payload)) {
            $member->role_id = $payload['role_id'];
        }

        if (! $member->exists) {
            $member->joined_at = $payload['joined_at'] ?? now();
        } elseif (array_key_exists('joined_at', $payload)) {
            $member->joined_at = $payload['joined_at'];
        }

        $member->save();

        $member->load('user:id,name,email');

        return ApiResponse::success(
            message: 'Workspace member saved successfully.',
            data: ['member' => $member],
            status: 200
        );
    }

    private function ensureWorkspaceAccess(Workspace $workspace, int $userId): void
    {
        if (! $workspace->containsUser($userId)) {
            throw new AuthorizationException('You are not allowed to access this workspace.');
        }
    }

    private function ensureWorkspaceManagement(Workspace $workspace, int $userId): void
    {
        if (! $workspace->isManagedBy($userId)) {
            throw new AuthorizationException('Only the workspace owner can manage members.');
        }
    }
}
