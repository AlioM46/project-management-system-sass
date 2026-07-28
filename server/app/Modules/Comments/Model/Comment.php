<?php

namespace App\Modules\Comments\Model;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $table = 'comments';

    protected $fillable = [
        'lead_id',
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

    public function recursiveReplies()
    {
        return $this->replies()->with(['recursiveReplies', 'author', 'attachments']);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function attachments()
    {
        return $this->hasMany(CommentAttachment::class);
    }

    public function scopeForLead($query, int $leadId)
    {
        return $query->where('lead_id', $leadId);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at');
    }

    public function mentions()
    {
        return $this->hasMany(Mention::class, 'source_id')
            ->where('source_type', 'comment');
    }

    public function getFormattedContentAttribute(): string
    {
        return nl2br((string) e((string) $this->content));
    }

    public function getCanUpdateAttribute(): bool
    {
        $user = auth()->user();

        return $user ? (int) $this->author_id === (int) $user->id : false;
    }

    public function getCanDeleteAttribute(): bool
    {
        return $this->getCanUpdateAttribute();
    }
}
