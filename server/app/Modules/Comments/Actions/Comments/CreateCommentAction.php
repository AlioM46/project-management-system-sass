<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Comments\Services\CommentService;
use App\Modules\Tasks\Model\Task;


class CreateCommentAction
{
    public function __construct(private CommentService $service)
    {
    }

    public function execute(CreateCommentRequest $request)
    {
        // dd($request->all(), $request->file('attachments'));
        $task = Task::findOrFail($request->task_id);
        $validated = $request->validated();




        return $this->service->createWithAttachments(
            $task,
            $request->user(),
            $validated['content'],
            $validated['attachments'] ?? [],
            $validated['parent_id'] ?? null
        );

    }
}
