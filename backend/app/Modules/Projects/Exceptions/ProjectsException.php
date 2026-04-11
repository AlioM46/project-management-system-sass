<?php

namespace App\Modules\Projects\Exceptions;

use App\Shared\Exceptions\BusinessException;

class ProjectsException extends BusinessException
{
    public static function projectNotFound(int $projectId, int $workspaceId): self
    {
        return new self(
            message: 'The selected project is invalid for this workspace.',
            errorCode: 'PROJECT_NOT_FOUND',
            status: 404,
            meta: [
                'project_id' => $projectId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function projectNameConflict(string $name, int $workspaceId): self
    {
        return new self(
            message: 'An active project with this name already exists in the workspace.',
            errorCode: 'PROJECT_NAME_CONFLICT',
            status: 409,
            meta: [
                'name' => $name,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function projectAlreadyDeleted(int $projectId, int $workspaceId): self
    {
        return new self(
            message: 'This project is already deleted.',
            errorCode: 'PROJECT_ALREADY_DELETED',
            status: 409,
            meta: [
                'project_id' => $projectId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function projectNotDeleted(int $projectId, int $workspaceId): self
    {
        return new self(
            message: 'Only deleted projects can be restored.',
            errorCode: 'PROJECT_NOT_DELETED',
            status: 409,
            meta: [
                'project_id' => $projectId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function projectDeletedImmutable(int $projectId, int $workspaceId): self
    {
        return new self(
            message: 'Deleted projects cannot be modified.',
            errorCode: 'PROJECT_DELETED_IMMUTABLE',
            status: 409,
            meta: [
                'project_id' => $projectId,
                'workspace_id' => $workspaceId,
            ]
        );
    }
}
