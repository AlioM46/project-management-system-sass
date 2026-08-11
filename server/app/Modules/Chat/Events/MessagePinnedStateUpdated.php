<?php

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Model\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class MessagePinnedStateUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{
    use SerializesModels;

    public Message $message;
    public ?Message $unpinnedMessage;

    public function __construct(Message $message, ?Message $unpinnedMessage = null)
    {
        $this->message = $message;
        $this->unpinnedMessage = $unpinnedMessage;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->message->workspace_id}.conversations.{$this->message->conversation_id}");
    }

    public function broadcastAs()
    {
        return "message.pinned_updated";
    }

    public function broadcastWith(): array
    {
        return [
            'pinned_message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'is_pinned' => $this->message->is_pinned,
                'pinned_at' => $this->message->pinned_at?->toISOString(),
                'body' => $this->message->body,
                'user' => $this->message->sender ? [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                ] : null,
            ],
            'unpinned_message_id' => $this->unpinnedMessage?->id,
        ];
    }
}
