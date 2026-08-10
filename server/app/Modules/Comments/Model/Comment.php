<?php

namespace App\Modules\Comments\Model;

use App\Models\User;
use App\Modules\Comments\Model\Mention;
use App\Modules\Tasks\Model\Task;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $table = 'comments'; // Ensure this matches your migration

    protected $fillable = [
        'task_id',
        'author_id',
        'parent_id',
        'content',
    ];

    protected $appends = [
        'formatted_content',
        'can_update',
        'can_delete',
    ];

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    /**
     * Recursive relationship for loading all nested replies.
     */
    public function recursiveReplies()
    {
        return $this->replies()->with(['recursiveReplies', 'author', 'attachments']);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function attachments()
    {
        return $this->hasMany(CommentAttachment::class);
    }

    public function scopeForTask($query, int $taskId)
    {
        return $query->where('task_id', $taskId);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at');
    }

    public function scopeOldestFirst($query)
    {
        return $query->orderBy('created_at');
    }

    public function mentions()
    {
        return $this->hasMany(Mention::class, 'source_id')
            ->where('source_type', 'comment');
    }

    public function getFormattedContentAttribute(): string
    {
        $escaped = e((string) $this->content);

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

        // 3. Sort usernames by length descending (longest first)
        usort($validUsernames, fn($a, $b) => strlen($b) - strlen($a));

        // Highlight ONLY valid usernames with original Comment inline style badge
        foreach ($validUsernames as $username) {
            $badge = '<span style="display:inline-block;border-radius:0.375rem;background:rgba(59,130,246,0.12);padding:0.125rem 0.375rem;color:#2563eb;font-weight:600;">@' . $username . '</span>';
            $escaped = str_replace('@' . $username, $badge, $escaped);
        }

        return nl2br((string) $escaped);
    }

    public function getCanUpdateAttribute(): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        return (int) $this->author_id === (int) $user->id;
    }

    public function getCanDeleteAttribute(): bool
    {
        return $this->getCanUpdateAttribute();
    }
}
