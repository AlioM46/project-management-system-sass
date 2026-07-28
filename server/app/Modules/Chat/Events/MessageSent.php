<?php


namespace App\Modules\Chat\Events;

use App\Modules\Chat\Model\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;



class MessageSent implements ShouldBroadcast, ShouldDispatchAfterCommit, ShouldRescue
{

    use SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("workspaces.{$this->message->workspace_id}.conversations.{$this->message->conversation_id}");
    }



    // so I can listen to many events with same url
    // "workspaces.{$this->message->workspace_id}.conversations.{$this->message->conversation_id}"
    public function broadcastAs()
    {
        return "messages.sent";
    }


    public function broadcastWith(): array
    {
        // Load the sender relationship if not already loaded
        if (!$this->message->relationLoaded('sender')) {
            $this->message->load('sender');
        }
        return [
            'id' => $this->message->id,
            'workspace_id' => $this->message->workspace_id,
            'conversation_id' => $this->message->conversation_id,
            'message_id' => $this->message->message_id,
            'body' => $this->message->body,
            'created_at' => $this->message->created_at?->toISOString(),
            'sender' => [
                'id' => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'avatar_url' => $this->message->sender->avatar_url,
            ],
        ];
    }



}