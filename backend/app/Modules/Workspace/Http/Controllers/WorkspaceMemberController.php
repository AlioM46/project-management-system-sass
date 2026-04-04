<?php

namespace App\Modules\Workspace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\AcceptWorkspaceInvite;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\InviteWorkspaceMember;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\ListWorkspaceMembers;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\RemoveWorkspaceMember;
use App\Modules\Workspace\Actions\WorkspaceMemberActions\UpdateWorkspaceMember;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\AcceptWorkspaceInviteRequest;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\InviteWorkspaceMemberRequest;
use App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests\UpdateWorkspaceMemberRequest;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class WorkspaceMemberController extends Controller
{
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

    public function update(Workspace_Members $member, UpdateWorkspaceMemberRequest $request, UpdateWorkspaceMember $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace member update endpoint scaffolded. Logic not implemented yet.',
            data: $action->execute($member, $request->validated())
        );
    }

    public function remove(Workspace_Members $member, RemoveWorkspaceMember $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Workspace member removal endpoint scaffolded. Logic not implemented yet.',
            data: $action->execute($member)
        );
    }
}
