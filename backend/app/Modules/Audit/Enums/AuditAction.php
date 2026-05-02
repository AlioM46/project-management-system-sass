<?php

namespace App\Modules\Audit\Enums;

enum AuditAction: string
{
    case WorkspaceCreated = 'workspace_created';
    case WorkspaceUpdated = 'workspace_updated';
    case WorkspaceDeleted = 'workspace_deleted';
    case WorkspaceRestored = 'workspace_restored';
    case ProjectCreated = 'project_created';
    case ProjectUpdated = 'project_updated';
    case ProjectDeleted = 'project_deleted';
    case ProjectRestored = 'project_restored';
    case TaskCreated = 'task_created';
    case TaskUpdated = 'task_updated';
    case TaskStatusChanged = 'task_status_changed';
    case TaskDeleted = 'task_deleted';
    case TaskAssigneeAdded = 'task_assignee_added';
    case TaskAssigneeRemoved = 'task_assignee_removed';
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
            fn (self $action): string => $action->value,
            self::cases()
        );
    }
}
