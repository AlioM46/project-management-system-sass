<?php

namespace App\Modules\Audit\Enums;

enum AuditMetadataKey: string
{
    case AssigneeUserId = 'assignee_user_id';
    case ExportedRowCount = 'exported_row_count';
    case Filters = 'filters';
    case InvitationEmail = 'invitation_email';
    case InvitationId = 'invitation_id';
    case ProjectId = 'project_id';
    case RoleId = 'role_id';
    case TaskId = 'task_id';
}
