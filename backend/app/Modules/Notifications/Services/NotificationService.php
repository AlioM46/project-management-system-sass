<?php

namespace App\Modules\Notifications\Services;

use App\Modules\Notifications\Model\Notification;
use App\Modules\Notifications\Events\NotificationCreated;

class NotificationService
{
    public function send(
        int $workspaceId,
        int $userId,
        string $type,
        array $data = []
    ): Notification {
        $notification = Notification::create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
        ]);

        // Real-time trigger
        event(new NotificationCreated($notification));

        return $notification;
    }
}