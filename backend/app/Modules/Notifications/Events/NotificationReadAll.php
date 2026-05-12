<?php

namespace App\Modules\Notifications\Events;

use App\Shared\Broadcasting\RealtimeChannel;
use Carbon\CarbonInterface;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class NotificationReadAll implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use SerializesModels;

    public function __construct(
        private readonly int $userId,
        private readonly int $workspaceId,
        private readonly CarbonInterface $readAt
    ) {}

    public function broadcastOn(): Channel
    {
        return RealtimeChannel::privateWorkspaceUser($this->workspaceId, $this->userId);
    }

    public function broadcastAs(): string
    {
        return 'notification.read.all';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => null,
            'type' => null,
            'data' => [],
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId,
            'read_at' => $this->readAt->toISOString(),
            'created_at' => null,
        ];
    }
}
