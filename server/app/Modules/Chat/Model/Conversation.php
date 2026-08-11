<?php

namespace App\Modules\Chat\Model;

use App\Modules\Projects\Model\Project;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Conversation extends Model
{
    use BelongsToWorkspace;
    protected $table = 'conversation';
    protected $fillable = [
        'workspace_id',
        'project_id',
        'name',
        'description',
        'type',
    ];



    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }


    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function readStates(): HasMany
    {
        return $this->hasMany(ConversationReadState::class);
    }

    public function attachments(): HasManyThrough
    {
        return $this->hasManyThrough(
            MessageAttachment::class,
            Message::class,
            'conversation_id',
            'message_id',
            'id',
            'id'
        );
    }

    public function pinnedUsers(): HasMany
    {
        return $this->hasMany(PinnedConversation::class, 'conversation_id');
    }
}