<?php

namespace App\Modules\Comments\Http\Controllers;

use App\Modules\Comments\Actions\Comments\CreateCommentAction;
use App\Modules\Comments\Actions\Comments\DeleteCommentAction;
use App\Modules\Comments\Actions\Comments\ListCommentsAction;
use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Comments\Model\Comment;
use App\Modules\Tasks\Model\Task;

class CommentsController
{
    public function store(CreateCommentRequest $request, CreateCommentAction $action)
    {
        return $action->execute($request);
    }

    public function index(int $taskId, ListCommentsAction $action)
    {
        return $action->execute($taskId);
    }

    public function destroy(int $commentId, DeleteCommentAction $action)
    {
        $action->execute($commentId, request()->user());

        return response()->noContent();
    }
}