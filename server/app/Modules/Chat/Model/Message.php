<?php

namespace App\Modules\Chat\Model;

use App\Models\User;
use App\Modules\Comments\Model\Mention;
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
        'delivered_at',
        'isEdited',
        'isDeleted',
        'deletedById',
    ];

    protected $casts = [
        'isEdited' => 'boolean',
        'isDeleted' => 'boolean',
        'delivered_at' => 'datetime',
    ];

    protected $appends = [
        "FormattedBody",
        'status'
    ];

    public function getStatusAttribute(): string
    {
        // Rule 1: Checkmarks ONLY appear on messages sent by ME
        if ($this->user_id !== auth()->id()) {
            return 'none';
        }
        // Step 1: Count total OTHER active participants in this chat (1 for Direct, 4 for Group)
        $otherParticipantsCount = \App\Modules\Chat\Model\ConversationParticipant::where('conversation_id', $this->conversation_id)
            ->where('user_id', '!=', auth()->id())
            ->where('is_active', true)
            ->count();
        if ($otherParticipantsCount === 0) {
            return 'sent';
        }
        // Step 2: Count how many of those participants have read_at >= message created_at
        $readStatesCount = \App\Modules\Chat\Model\ConversationReadState::where('conversation_id', $this->conversation_id)
            ->where('user_id', '!=', auth()->id())
            ->where('read_at', '>=', $this->created_at)
            ->count();
        // Step 3: ONLY if read count equals total participants count -> ALL users read it!
        if ($readStatesCount >= $otherParticipantsCount) {
            return 'read'; // Turns BLUE ✓✓
        }
        // Step 4: Check DELIVERED (Double Grey ✓✓)
        if ($this->delivered_at !== null) {
            return 'delivered'; // Double Grey ✓✓
        }
        // Step 5: Otherwise SENT (Single Grey ✓)
        return 'sent';
    }

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

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class, 'message_id');
    }

    public function starredByUsers(): HasMany
    {
        return $this->hasMany(StarredMessage::class, 'message_id');
    }

    public function deletions(): HasMany
    {
        return $this->hasMany(MessageDeletion::class, 'message_id');
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(Mention::class, 'source_id')
            ->where('source_type', 'message');
    }
    public function getFormattedBodyAttribute(): string
    {
        $escaped = e((string) $this->body);

        // 1. Get ONLY valid usernames from DB mentions table
        $validUsernames = $this->mentions
            ->loadMissing('mentionedUser')
            ->pluck('mentionedUser.username')
            ->filter()
            ->toArray();

        // 2. No valid mentions? Return plain text
        if (empty($validUsernames)) {
            return nl2br((string) $escaped);
        }

        // 3. Sort usernames by length descending (longest first) to prevent partial matching (e.g. @ali_omar vs @ali)
        usort($validUsernames, fn($a, $b) => strlen($b) - strlen($a));

        // Highlight ONLY the valid usernames with original Comment inline style badge
        foreach ($validUsernames as $username) {
            $badge = '<span style="display:inline-block;border-radius:0.375rem;background:rgba(59,130,246,0.12);padding:0.125rem 0.375rem;color:#2563eb;font-weight:600;">@' . $username . '</span>';
            $escaped = str_replace('@' . $username, $badge, $escaped);
        }

        return nl2br((string) $escaped);
    }


    public function scopeVisibleToParticipant($query, ?ConversationParticipant $participant)
    {
        $userId = auth()->id();
        return $query->when($participant && $participant->cleared_at, function ($q) use ($participant) {
            $q->where('created_at', '>', $participant->cleared_at);
        })->whereDoesntHave('deletions', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }
}
