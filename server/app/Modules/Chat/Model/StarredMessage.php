<?php

namespace App\Modules\Chat\Model;

use App\Models\User;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StarredMessage extends Model
{
    use BelongsToWorkspace;

    protected $table = 'starred_messages';

    protected $fillable = [
        'workspace_id',
        'conversation_id',
        'user_id',
        'message_id',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }
}
