<?php

namespace App\Modules\Comments\Http\Controllers;

use App\Modules\Comments\Actions\Comments\CreateCommentAction;
use App\Modules\Comments\Actions\Comments\DeleteAttachmentAction;
use App\Modules\Comments\Actions\Comments\DeleteCommentAction;
use App\Modules\Comments\Actions\Comments\ListCommentsAction;
use App\Modules\Comments\Actions\Comments\UpdateCommentAction;
use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Comments\Http\Requests\UpdateCommentRequest;

class CommentsController
{
    public function store(CreateCommentRequest $request, CreateCommentAction $action)
    {
        return $action->execute($request);
    }

    public function index(int $taskId, ListCommentsAction $action)
    {
        $filters = request()->only(['page', 'per_page']);

        return $action->execute($taskId, $filters);
    }

    public function update(UpdateCommentRequest $request, int $commentId, UpdateCommentAction $action)
    {
        $content = $request->validated('content');
        $attachments = $request->file('attachments', []);

        return $action->execute($commentId, request()->user(), $content, $attachments);
    }

    public function destroy(int $commentId, DeleteCommentAction $action)
    {
        $action->execute($commentId, request()->user());

        return response()->noContent();
    }

    public function destroyAttachment(int $attachmentId, DeleteAttachmentAction $action)
    {
        $action->execute($attachmentId, request()->user());

        return response()->noContent();
    }
}
