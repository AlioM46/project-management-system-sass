<?php
namespace App\Modules\Chat\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class MessageDelivered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $workspaceId;
    public int $conversationId;
    public string $deliveredAt;

    public function __construct(int $workspaceId, int $conversationId, string $deliveredAt)
    {
        $this->workspaceId = $workspaceId;
        $this->conversationId = $conversationId;
        $this->deliveredAt = $deliveredAt;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->workspaceId}.conversations.{$this->conversationId}");
    }

    public function broadcastAs(): string
    {
        return 'messages.delivered';
    }
}
