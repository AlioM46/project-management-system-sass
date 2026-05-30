<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Services\CommentService;

class DeleteCommentAction
{
    public function __construct(
        private CommentService $service
    ) {}

    public function execute(int $commentId, $user)
    {
        $comment = Comment::with('task')->findOrFail($commentId);

        $this->service->delete($comment, $user);
    }
}
