<?php

namespace App\Modules\Comments\Services;

use App\Modules\Comments\Model\Comment;
use App\Modules\Tasks\Model\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class CommentService
{
    public function create(Task $task, User $user, string $content): Comment
    {
        return Comment::create([
            'task_id' => $task->id,
            'author_id' => $user->id,
            'content' => $content,
        ]);
    }

    public function delete(Comment $comment, User $actor): void
    {
        // check if admin or owner of the task
        if ($comment->author_id !== $actor->id) {
            throw new \Exception("Unauthorized");
        }

        $comment->delete();
    }

    public function listByTask(int $taskId): Collection
    {
        return Comment::query()
            ->forTask($taskId)
            ->with('author')
            ->latestFirst()
            ->get();
    }
}