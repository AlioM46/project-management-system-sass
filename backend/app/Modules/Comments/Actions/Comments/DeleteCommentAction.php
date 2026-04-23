<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Services\CommentService;
use App\Modules\Comments\Model\Comment;

class DeleteCommentAction
{
    public function __construct(
        private CommentService $service
    ) {
    }


    public function execute(int $commentId, $user)
    {
        $comment = Comment::findOrFail($commentId);
        $this->service->delete($comment, $user);
    }
}