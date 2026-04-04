<?php

namespace App\Modules\Workspace\Exceptions;

use App\Shared\Exceptions\BusinessException;

class WorkspaceContextException extends BusinessException
{
    public static function missingHeader(string $headerName): self
    {
        return new self(
            message: "Missing {$headerName} header.",
            errorCode: 'WORKSPACE_CONTEXT_MISSING_HEADER',
            status: 400,
            meta: ['header' => $headerName]
        );
    }
    public static function workspaceNotManagedByUser(string $username, int $workspaceId): self
    {
        return new self(
            message: "User {$username} is not the owner of the current workspace.",
            errorCode: 'WORKSPACE_CONTEXT_NOT_MANAGED_BY_USER',
            status: 403,
            meta: ['username' => $username, 'workspace_id' => $workspaceId]
        );

    }

    
    public static function invalidHeader(string $headerName): self
    {
        return new self(
            message: "Invalid {$headerName} header format.",
            errorCode: 'WORKSPACE_CONTEXT_INVALID_HEADER',
            status: 400,
            meta: ['header' => $headerName]
        );
    }

    public static function workspaceNotFound(int $workspaceId): self
    {
        return new self(
            message: 'Workspace not found.',
            errorCode: 'WORKSPACE_CONTEXT_NOT_FOUND',
            status: 404,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function workspaceNotArchived(int $workspaceId): self
    {
        return new self(
            message: 'Workspace is not archived.',
            errorCode: 'WORKSPACE_CONTEXT_NOT_ARCHIVED',
            status: 409,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function invalidSuccessorMember(int $successorMemberId, int $workspaceId): self
    {
        return new self(
            message: 'The selected successor member is invalid for this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_INVALID_SUCCESSOR_MEMBER',
            status: 422,
            meta: [
                'successor_member_id' => $successorMemberId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function noEligibleSuccessor(int $workspaceId): self
    {
        return new self(
            message: 'No eligible successor member was found for this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_NO_ELIGIBLE_SUCCESSOR',
            status: 409,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function workspaceRoleNotFound(string $roleName, int $workspaceId): self
    {
        return new self(
            message: "Workspace role {$roleName} not found.",
            errorCode: 'WORKSPACE_CONTEXT_ROLE_NOT_FOUND',
            status: 409,
            meta: [
                'role_name' => $roleName,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function invalidInviteRole(int $roleId, int $workspaceId): self
    {
        return new self(
            message: 'The selected role is invalid for this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_INVALID_INVITE_ROLE',
            status: 422,
            meta: [
                'role_id' => $roleId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function ownerRoleCannotBeAssigned(int $workspaceId): self
    {
        return new self(
            message: 'The Owner role cannot be assigned through workspace invitations.',
            errorCode: 'WORKSPACE_CONTEXT_OWNER_ROLE_NOT_ASSIGNABLE',
            status: 422,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function inviteRoleUnavailable(int $workspaceId): self
    {
        return new self(
            message: 'No assignable role is available for this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_INVITE_ROLE_UNAVAILABLE',
            status: 409,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function inviteEmailAlreadyMember(string $email, int $workspaceId): self
    {
        return new self(
            message: 'This user is already a member of the workspace.',
            errorCode: 'WORKSPACE_CONTEXT_INVITE_EMAIL_ALREADY_MEMBER',
            status: 409,
            meta: [
                'email' => $email,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function cannotInviteSelf(int $workspaceId): self
    {
        return new self(
            message: 'You cannot invite yourself to this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_INVITE_SELF_FORBIDDEN',
            status: 422,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function invalidInvitationToken(): self
    {
        return new self(
            message: 'Invitation token is invalid.',
            errorCode: 'WORKSPACE_INVITE_INVALID_TOKEN',
            status: 403
        );
    }

    public static function invitationExpired(int $invitationId, int $workspaceId): self
    {
        return new self(
            message: 'Invitation has expired.',
            errorCode: 'WORKSPACE_INVITE_EXPIRED',
            status: 410,
            meta: [
                'invitation_id' => $invitationId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function invitationAlreadyHandled(int $invitationId, string $status): self
    {
        return new self(
            message: 'Invitation is no longer pending.',
            errorCode: 'WORKSPACE_INVITE_ALREADY_HANDLED',
            status: 409,
            meta: [
                'invitation_id' => $invitationId,
                'status' => $status,
            ]
        );
    }

    public static function invitationEmailMismatch(int $invitationId): self
    {
        return new self(
            message: 'This invitation is for a different email address.',
            errorCode: 'WORKSPACE_INVITE_EMAIL_MISMATCH',
            status: 403,
            meta: ['invitation_id' => $invitationId]
        );
    }

    public static function notAMember(int $workspaceId): self
    {
        return new self(
            message: 'You are not a member of this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_FORBIDDEN',
            status: 403,
            meta: ['workspace_id' => $workspaceId]
        );
    }

    public static function missingScopedModelContext(string $modelName): self
    {
        return new self(
            message: "Workspace context is required to access {$modelName}.",
            errorCode: 'WORKSPACE_CONTEXT_REQUIRED',
            status: 400,
            meta: ['model' => $modelName]
        );
    }

    public static function workspaceMismatch(int $providedWorkspaceId, int $currentWorkspaceId): self
    {
        return new self(
            message: 'The provided workspace_id does not match the active workspace context.',
            errorCode: 'WORKSPACE_CONTEXT_MISMATCH',
            status: 409,
            meta: [
                'workspace_id' => $providedWorkspaceId,
                'current_workspace_id' => $currentWorkspaceId,
            ]
        );
    }
}
