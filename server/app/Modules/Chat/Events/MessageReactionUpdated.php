<?php

namespace App\Modules\Chat\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class MessageReactionUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use SerializesModels;

    public int $workspaceId;
    public int $conversationId;
    public int $messageId;
    public array $reactions;

    public function __construct(int $workspaceId, int $conversationId, int $messageId, array $reactions)
    {
        $this->workspaceId = $workspaceId;
        $this->conversationId = $conversationId;
        $this->messageId = $messageId;
        $this->reactions = $reactions;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->workspaceId}.conversations.{$this->conversationId}");
    }

    public function broadcastAs()
    {
        return "messages.reaction.updated";
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message_id' => $this->messageId,
            'reactions' => $this->reactions,
        ];
    }
}
