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

    public static function notAMember(int $workspaceId): self
    {
        return new self(
            message: 'You are not a member of this workspace.',
            errorCode: 'WORKSPACE_CONTEXT_FORBIDDEN',
            status: 403,
            meta: ['workspace_id' => $workspaceId]
        );
    }
}
