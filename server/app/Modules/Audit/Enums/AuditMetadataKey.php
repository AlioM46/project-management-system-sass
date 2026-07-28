<?php

namespace App\Modules\Audit\Enums;

enum AuditMetadataKey: string
{
    case AssigneeUserId = 'assignee_user_id';
    case ExportedRowCount = 'exported_row_count';
    case Filters = 'filters';
    case InvitationEmail = 'invitation_email';
    case InvitationId = 'invitation_id';
    case CourseId = 'course_id';
    case StageId = 'stage_id';
    case RoleId = 'role_id';
    case LeadId = 'lead_id';
    case StudentId = 'student_id';
    case OutboundMessageId = 'outbound_message_id';
    case Provider = 'provider';
    case TemplateKey = 'template_key';
    case RecipientPhone = 'recipient_phone';
}
