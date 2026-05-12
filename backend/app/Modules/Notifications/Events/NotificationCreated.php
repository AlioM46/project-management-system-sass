<?php

namespace App\Modules\Notifications\Events;

use App\Modules\Notifications\Model\Notification;
use App\Shared\Broadcasting\RealtimeChannel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use SerializesModels;

    public function __construct(
        public Notification $notification
    ) {}

    public function broadcastOn(): Channel
    {
        return RealtimeChannel::privateWorkspaceUser(
            $this->notification->workspace_id,
            $this->notification->user_id
        );
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'data' => $this->notification->data,
            'workspace_id' => $this->notification->workspace_id,
            'user_id' => $this->notification->user_id,
            'read_at' => $this->notification->read_at?->toISOString(),
            'created_at' => $this->notification->created_at?->toISOString(),
        ];
    }
}
