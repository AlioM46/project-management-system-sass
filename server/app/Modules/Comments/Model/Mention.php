<?php
namespace App\Modules\Comments\Model;

use App\Modules\Chat\Model\Message;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Modules\Comments\Model\Comment;

class Mention extends Model
{
    protected $fillable = [
        'mentioned_user_id',
        'workspace_id',
        'source_type',
        'source_id',
        'mentioned_by_user_id',
        'read_at'
    ];

    public function mentionedUser()
    {
        return $this->belongsTo(User::class, 'mentioned_user_id');
    }

    public function mentionedByUser()
    {
        return $this->belongsTo(User::class, 'mentioned_by_user_id');
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class, 'source_id')
            ->where('source_type', 'comment');
    }

    public function message()
    {
        return $this->belongsTo(Message::class, 'source_id')
            ->where('source_type', 'message');
    }
}

