<?php

namespace App\Modules\Notifications\Enums;

class NotificationType
{
    const TASK_ASSIGNED = 'task_assigned';
    const TASK_UPDATED = 'task_updated';
    const MENTIONED = 'mentioned';
    const CHAT_MESSAGE = 'chat_message';
    const WORKSPACE_INVITE = 'workspace_invite';
}