<?php

namespace App\Modules\Chat\Model;

use App\Models\User;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageDeletion extends Model
{

    protected $table = 'message_deletions';

    protected $fillable = [
        'message_id',
        'user_id',
    ];

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function deletedMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }



}
