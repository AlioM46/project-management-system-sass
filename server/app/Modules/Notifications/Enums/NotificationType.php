<?php

namespace App\Modules\Notifications\Enums;

class NotificationType
{
    const INFO = 'info';
    const MENTIONED = 'mentioned';

    const COMMENT_REPLIED = 'comment_replied';

    const TASK_ASSIGNED = 'task_assigned';

    const TASK_UPDATED = 'task_updated';

    const CHAT_MESSAGE = 'chat_message';

    const WORKSPACE_INVITE = 'workspace_invite';
}
