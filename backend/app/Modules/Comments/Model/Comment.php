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
}
