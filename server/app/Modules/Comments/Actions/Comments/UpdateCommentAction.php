<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Services\CommentService;

class UpdateCommentAction
{
    public function __construct(
        private CommentService $service
    ) {
    }

    public function execute(int $commentId, $user, string $content, ?array $attachments = null)
    {
        $comment = Comment::with('task')->findOrFail($commentId);

        return $this->service->update($comment, $user, $content, $attachments);
    }
}
