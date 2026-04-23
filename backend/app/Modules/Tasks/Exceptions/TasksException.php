<?php

namespace App\Modules\Tasks\Exceptions;

use App\Shared\Exceptions\BusinessException;

class TasksException extends BusinessException
{
    public static function invalidStatusTransition(string $fromStatus, string $toStatus): self
    {
        return new self(
            message: "Cannot transition task from status '{$fromStatus}' to '{$toStatus}'.",
            errorCode: 'TASK_INVALID_STATUS_TRANSITION',
            status: 422,
            meta: [
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
            ]
        );
    }
    public static function taskNotFound(int $taskId, int $workspaceId): self
    {
        return new self(
            message: 'The selected task is invalid for this workspace.',
            errorCode: 'TASK_NOT_FOUND',
            status: 404,
            meta: [
                'task_id' => $taskId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function projectNotFound(int $projectId, int $workspaceId): self
    {
        return new self(
            message: 'The selected project is invalid for this workspace.',
            errorCode: 'TASK_PROJECT_NOT_FOUND',
            status: 404,
            meta: [
                'project_id' => $projectId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function taskAlreadyDeleted(int $taskId, int $workspaceId): self
    {
        return new self(
            message: 'This task is already deleted.',
            errorCode: 'TASK_ALREADY_DELETED',
            status: 409,
            meta: [
                'task_id' => $taskId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function taskDeletedImmutable(int $taskId, int $workspaceId): self
    {
        return new self(
            message: 'Deleted tasks cannot be modified.',
            errorCode: 'TASK_DELETED_IMMUTABLE',
            status: 409,
            meta: [
                'task_id' => $taskId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function unauthorizedToUpdateTask(int $taskId, int $userId): self
    {
        return new self(
            message: 'You are not authorized to update this task.',
            errorCode: 'TASK_UNAUTHORIZED',
            status: 403,
            meta: [
                'task_id' => $taskId,
                'user_id' => $userId,
            ]
        );
    }

    public static function userNotInWorkspace(int $userId, int $workspaceId): self
    {
        return new self(
            message: 'The selected user is not a member of this workspace.',
            errorCode: 'TASK_ASSIGNEE_NOT_IN_WORKSPACE',
            status: 422,
            meta: [
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function assigneeAlreadyExists(int $userId, int $taskId): self
    {
        return new self(
            message: 'The selected user is already assigned to this task.',
            errorCode: 'TASK_ASSIGNEE_ALREADY_EXISTS',
            status: 409,
            meta: [
                'user_id' => $userId,
                'task_id' => $taskId,
            ]
        );
    }
}
