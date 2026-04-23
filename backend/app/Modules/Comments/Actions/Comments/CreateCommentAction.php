<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Tasks\Model\Task;
use App\Modules\Comments\Services\CommentService;

class CreateCommentAction
{
    public function __construct(
        private CommentService $service
    ) {
    }

    public function execute(CreateCommentRequest $request)
    {
        $task = Task::findOrFail($request->task_id);

        return $this->service->create(
            $task,
            $request->user(),
            $request->validated()['content']
        );
    }
}