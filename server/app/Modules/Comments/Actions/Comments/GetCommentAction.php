<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Model\Comment;

class GetCommentAction
{
    public function execute(int $commentId): Comment
    {
        return Comment::with(['author', 'attachments', 'mentions', 'recursiveReplies'])
            ->findOrFail($commentId);
    }
}
