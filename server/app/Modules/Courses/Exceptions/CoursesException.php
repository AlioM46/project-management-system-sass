<?php

namespace App\Modules\Courses\Exceptions;

use App\Shared\Exceptions\BusinessException;

class CoursesException extends BusinessException
{
    public static function courseNotFound(int $courseId, int $workspaceId): self
    {
        return new self(
            message: 'The selected course is invalid for this workspace.',
            errorCode: 'COURSE_NOT_FOUND',
            status: 404,
            meta: [
                'course_id' => $courseId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function courseNameConflict(string $name, int $workspaceId): self
    {
        return new self(
            message: 'An active course with this name already exists in the workspace.',
            errorCode: 'COURSE_NAME_CONFLICT',
            status: 409,
            meta: [
                'name' => $name,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function courseAlreadyDeleted(int $courseId, int $workspaceId): self
    {
        return new self(
            message: 'This course is already deleted.',
            errorCode: 'COURSE_ALREADY_DELETED',
            status: 409,
            meta: [
                'course_id' => $courseId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function courseNotDeleted(int $courseId, int $workspaceId): self
    {
        return new self(
            message: 'Only deleted courses can be restored.',
            errorCode: 'COURSE_NOT_DELETED',
            status: 409,
            meta: [
                'course_id' => $courseId,
                'workspace_id' => $workspaceId,
            ]
        );
    }

    public static function courseDeletedImmutable(int $courseId, int $workspaceId): self
    {
        return new self(
            message: 'Deleted courses cannot be modified.',
            errorCode: 'COURSE_DELETED_IMMUTABLE',
            status: 409,
            meta: [
                'course_id' => $courseId,
                'workspace_id' => $workspaceId,
            ]
        );
    }
}
