<?php

namespace App\Modules\Notifications\Services;

use App\Modules\Notifications\Events\NotificationCreated;
use App\Modules\Notifications\Model\Notification;

class NotificationService
{
    public function send(
        int $workspaceId,
        int $userId,
        string $type,
        array $data = []
    ): Notification {
        $notification = Notification::query()->create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
        ]);

        event(new NotificationCreated($notification));

        return $notification;
    }



}
