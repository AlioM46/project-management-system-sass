<?php

namespace App\Modules\Chat\Model;

use App\Models\User;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use BelongsToWorkspace;

    protected $table = 'messages';

    protected $fillable = [
        'workspace_id',
        'conversation_id',
        'message_id', // Threading / Parent Reply ID
        'user_id',    // Sender
        'body',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Threading support: Parent Message
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    // Threading support: Replies
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class, 'message_id');
    }
}
