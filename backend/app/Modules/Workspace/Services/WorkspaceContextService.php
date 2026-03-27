<?php

namespace App\Modules\Workspace\Services;

use App\Models\User;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Http\Request;

class WorkspaceContextService
{
    public const HEADER_NAME = 'X-Workspace-Id';

    private ?int $workspaceId = null;
    private ?int $memberId = null;
    private ?int $roleId = null;
    private ?Workspace $workspace = null;
    private ?Workspace_Members $membership = null;

    public function resolveFromRequest(Request $request, User $user): void
    {
        $header = $request->header(self::HEADER_NAME);

        if ($header === null || $header === '') {
            throw WorkspaceContextException::missingHeader(self::HEADER_NAME);
        }

        if (!ctype_digit((string) $header)) {
            throw WorkspaceContextException::invalidHeader(self::HEADER_NAME);
        }

        $workspaceId = (int) $header;
        $workspace = Workspace::query()->find($workspaceId);

        if (!$workspace) {
            throw WorkspaceContextException::workspaceNotFound($workspaceId);
        }

        $membership = Workspace_Members::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            throw WorkspaceContextException::notAMember($workspace->id);
        }

        $this->workspaceId = (int) $workspace->id;
        $this->memberId = (int) $membership->id;
        $this->roleId = $membership->role_id !== null ? (int) $membership->role_id : null;
        $this->workspace = $workspace;
        $this->membership = $membership;
    }
    public function currentWorkspaceId(): ?int
    {
        return $this->workspaceId;
    }
    public function currentMemberId(): ?int
    {
        return $this->memberId;
    }
    public function currentRoleId(): ?int
    {
        return $this->roleId;
    }
    public function currentWorkspace(): ?Workspace
    {
        return $this->workspace;
    }
    public function currentMembership(): ?Workspace_Members
    {
        return $this->membership;
    }
    public function hasContext(): bool
    {
        return $this->workspaceId !== null;
    }
    public function context(): array
    {
        return [
            'workspace_id' => $this->workspaceId,
            'member_id' => $this->memberId,
            'role_id' => $this->roleId,
        ];
    }

    public function clear(): void
    {
        $this->workspaceId = null;
        $this->memberId = null;
        $this->roleId = null;
        $this->workspace = null;
        $this->membership = null;
    }
}
