<?php

namespace App\Modules\Workspace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\AcceptWorkspaceInvite;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\ChangeWorkspaceMemberRole;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\InviteWorkspaceMember;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\ListWorkspaceMembers;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\RemoveWorkspaceMember;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\AcceptWorkspaceInviteRequest;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\InviteWorkspaceMemberRequest;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\UpdateWorkspaceMemberRequest;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Modules\Workspace\Services\WorkspaceMembersService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class WorkspaceMemberController extends Controller
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly WorkspaceMembersService $workspaceMembersService
    ) {}

    /*
        WorkspaceMemberController.php handles membership inside the active workspace:
            list members
            invite member
            update member
            remove member
            */
    public function members(ListWorkspaceMembers $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace members retrieved successfully.',
            data: $action->execute()
        );
    }

    public function sendInvite(InviteWorkspaceMemberRequest $request, InviteWorkspaceMember $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace invitation sent successfully.',
            data: $action->execute($request->validated()),
            status: 202
        );
    }

    public function acceptInvite(AcceptWorkspaceInviteRequest $request, AcceptWorkspaceInvite $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace invitation accepted successfully.',
            data: $action->execute($request->user(), $request->validated())
        );
    }

    public function changeMemberRole(int $memberId, UpdateWorkspaceMemberRequest $request, ChangeWorkspaceMemberRole $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace member role updated successfully.',
            data: $action->execute($memberId, $request->validated())
        );
    }

    public function showMember(int $memberId): JsonResponse
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $membership = $this->workspaceMembersService->resolveWorkspaceMember($workspace, $memberId);
        $membership->load([
            'user:id,name,email',
            'role:id,workspace_id,name,description,is_system',
        ]);

        return ApiResponse::success(
            message: 'Workspace member retrieved successfully.',
            data: ['member' => $membership]
        );
    }

    public function remove(int $memberId, RemoveWorkspaceMember $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace member removal endpoint scaffolded. Logic not implemented yet.',
            data: $action->execute($memberId)
        );
    }
}
