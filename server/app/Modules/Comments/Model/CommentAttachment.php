<?php

namespace App\Modules\Comments\Model;

use Illuminate\Database\Eloquent\Model;

class CommentAttachment extends Model
{
    protected $table = 'comment_attachments';

    protected $fillable = [
        'comment_id',
        'object_key',
        'file_type',
        'file_size',
    ];

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}
