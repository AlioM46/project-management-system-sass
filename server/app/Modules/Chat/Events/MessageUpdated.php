<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Model\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class MessageUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use SerializesModels;

    public Message $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->message->workspace_id}.conversations.{$this->message->conversation_id}");
    }

    public function broadcastAs()
    {
        return "messages.updated";
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'workspace_id' => $this->message->workspace_id,
            'conversation_id' => $this->message->conversation_id,
            'body' => $this->message->body,
            'isEdited' => $this->message->isEdited,
            'updated_at' => $this->message->updated_at?->toISOString(),
        ];
    }
}
