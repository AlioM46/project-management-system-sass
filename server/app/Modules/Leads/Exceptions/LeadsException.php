<?php

namespace App\Modules\Leads\Exceptions;

use App\Shared\Exceptions\BusinessException;

class LeadsException extends BusinessException
{
    public static function leadNotFound(int $leadId, int $workspaceId): self
    {
        return new self('The selected lead is invalid for this workspace.', 'LEAD_NOT_FOUND', 404, [
            'lead_id' => $leadId,
            'workspace_id' => $workspaceId,
        ]);
    }

    public static function courseNotFound(int $courseId, int $workspaceId): self
    {
        return new self('The selected course is invalid for this workspace.', 'LEAD_COURSE_NOT_FOUND', 404, [
            'course_id' => $courseId,
            'workspace_id' => $workspaceId,
        ]);
    }

    public static function stageNotFound(int $stageId, int $workspaceId): self
    {
        return new self('The selected stage is invalid for this workspace.', 'LEAD_STAGE_NOT_FOUND', 404, [
            'stage_id' => $stageId,
            'workspace_id' => $workspaceId,
        ]);
    }

    public static function stageCourseMismatch(int $stageId, int $courseId): self
    {
        return new self('The selected stage does not belong to the selected course.', 'LEAD_STAGE_COURSE_MISMATCH', 422, [
            'stage_id' => $stageId,
            'course_id' => $courseId,
        ]);
    }

    public static function leadAlreadyDeleted(int $leadId, int $workspaceId): self
    {
        return new self('This lead is already deleted.', 'LEAD_ALREADY_DELETED', 409, [
            'lead_id' => $leadId,
            'workspace_id' => $workspaceId,
        ]);
    }

    public static function leadDeletedImmutable(int $leadId, int $workspaceId): self
    {
        return new self('Deleted leads cannot be modified.', 'LEAD_DELETED_IMMUTABLE', 409, [
            'lead_id' => $leadId,
            'workspace_id' => $workspaceId,
        ]);
    }

    public static function unauthorizedToUpdateLead(int $leadId, int $userId): self
    {
        return new self('You are not authorized to update this lead.', 'LEAD_UNAUTHORIZED', 403, [
            'lead_id' => $leadId,
            'user_id' => $userId,
        ]);
    }

    public static function userNotInWorkspace(int $userId, int $workspaceId): self
    {
        return new self('The selected user is not a member of this workspace.', 'LEAD_ASSIGNEE_NOT_IN_WORKSPACE', 422, [
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
        ]);
    }
}
