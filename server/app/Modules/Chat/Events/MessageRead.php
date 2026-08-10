<?php
namespace App\Modules\Chat\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $workspaceId;
    public int $conversationId;
    public int $userId;
    public string $readAt;

    public function __construct(int $workspaceId, int $conversationId, int $userId, string $readAt)
    {
        $this->workspaceId = $workspaceId;
        $this->conversationId = $conversationId;
        $this->userId = $userId;
        $this->readAt = $readAt;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->workspaceId}.conversations.{$this->conversationId}");
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }
}
