<?php

namespace App\Modules\Notifications\Enums;

class NotificationType
{
    const MENTIONED = 'mentioned';

    const COMMENT_REPLIED = 'comment_replied';

    const LEAD_ASSIGNED = 'lead_assigned';

    const LEAD_UPDATED = 'lead_updated';

    const LEAD_CONVERTED = 'lead_converted';

    const STUDENT_CREATED = 'student_created';

    const WHATSAPP_SEND_FAILED = 'whatsapp_send_failed';

    const CHAT_MESSAGE = 'chat_message';

    const WORKSPACE_INVITE = 'workspace_invite';
}
