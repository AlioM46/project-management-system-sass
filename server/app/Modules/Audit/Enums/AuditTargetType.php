<?php

namespace App\Modules\Audit\Enums;

enum AuditTargetType: string
{
    case Workspace = 'workspace';
    case Course = 'course';
    case Lead = 'lead';
    case Student = 'student';
    case OutboundMessage = 'outbound_message';
    case Comment = 'comment';
    case WorkspaceMember = 'workspace_member';
    case WorkspaceInvitation = 'workspace_invitation';
    case Role = 'role';
    case AuditLog = 'audit_log';

    public static function values(): array
    {
        return array_map(
            fn (self $targetType): string => $targetType->value,
            self::cases()
        );
    }
}
