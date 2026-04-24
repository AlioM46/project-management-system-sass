<?php

namespace App\Modules\Comments\Services;

use App\Modules\Comments\Model\Comment;
use App\Modules\Tasks\Model\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use App\Modules\Comments\Model\CommentAttachment;

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

    public function createWithAttachments(Task $task, User $user, string $content, array $attachments = []): Comment
    {
        $comment = $this->create($task, $user, $content);

        // dd(ini_get('curl.cainfo'), ini_get('openssl.cafile'));
        foreach ($attachments as $attachment) {

            $fileName = uniqid() . '.' . $attachment->getClientOriginalExtension();
            try {
                $path = Storage::disk('r2')->putFileAs(
                    'attachments/' . $task->id,
                    $attachment,
                    $fileName
                );

                if (!$path) {
                    throw new \Exception('Upload failed for file');
                }

                CommentAttachment::create([
                    'comment_id' => $comment->id,
                    'object_key' => $path,
                    'file_type' => $attachment->getMimeType(),
                    'file_size' => $attachment->getSize(),
                ]);

            } catch (\Throwable $e) {
                logger()->error('R2 upload failed', [
                    'error' => $e->getMessage(),
                ]);

                throw $e;
            }
        }

        return $comment;
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