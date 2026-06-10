<?php

namespace App\Modules\Audit\Enums;

enum AuditAction: string
{
    case WorkspaceCreated = 'workspace_created';
    case WorkspaceUpdated = 'workspace_updated';
    case WorkspaceDeleted = 'workspace_deleted';
    case WorkspaceRestored = 'workspace_restored';
    case CourseCreated = 'course_created';
    case CourseUpdated = 'course_updated';
    case CourseDeleted = 'course_deleted';
    case CourseRestored = 'course_restored';
    case LeadCreated = 'lead_created';
    case LeadUpdated = 'lead_updated';
    case LeadStageChanged = 'lead_stage_changed';
    case LeadDeleted = 'lead_deleted';
    case LeadConvertedToStudent = 'lead_converted_to_student';
    case LeadAssigneeAdded = 'lead_assignee_added';
    case LeadAssigneeRemoved = 'lead_assignee_removed';
    case StudentCreated = 'student_created';
    case StudentStatusUpdated = 'student_status_updated';
    case WhatsAppMessageQueued = 'whatsapp_message_queued';
    case WhatsAppMessageSent = 'whatsapp_message_sent';
    case WhatsAppMessageFailed = 'whatsapp_message_failed';
    case CommentCreated = 'comment_created';
    case CommentUpdated = 'comment_updated';
    case CommentDeleted = 'comment_deleted';
    case MemberInvited = 'member_invited';
    case MemberJoined = 'member_joined';
    case MemberRemoved = 'member_removed';
    case MemberRoleChanged = 'member_role_changed';
    case RoleCreated = 'role_created';
    case RoleUpdated = 'role_updated';
    case RoleDeleted = 'role_deleted';
    case RolePermissionsUpdated = 'role_permissions_updated';
    case AuditExported = 'audit_exported';

    public static function values(): array
    {
        return array_map(
            fn(self $action): string => $action->value,
            self::cases()
        );
    }
}
