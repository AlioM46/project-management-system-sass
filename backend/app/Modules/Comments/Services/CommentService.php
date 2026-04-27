<?php

namespace App\Modules\Comments\Services;

use App\Models\User;
use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Model\CommentAttachment;
use App\Modules\Tasks\Model\Task;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CommentService
{
    public function __construct(
        private CommentAttachmentService $attachmentService
    ) {}

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

        if (! empty($attachments)) {
            $this->attachmentService->upload($comment, $attachments);
        }

        return $comment->fresh('attachments');
    }

    public function delete(Comment $comment, User $actor, bool $isAdminOrOwner = false): void
    {
        // check if admin or owner of the task
        if (! $isAdminOrOwner && $comment->author_id !== $actor->id) {
            throw new \Exception('Unauthorized');
        }

        // Delete attachments via service
        $this->attachmentService->deleteAll($comment);

        $comment->delete();
    }

    public function deleteAttachment(CommentAttachment $attachment, User $actor, bool $isAdminOrOwner = false): void
    {
        $comment = $attachment->comment;

        // Author can delete their own attachment, or admin/owner can delete any
        if (! $isAdminOrOwner && $comment->author_id !== $actor->id) {
            throw new \Exception('Unauthorized');
        }

        $this->attachmentService->delete($attachment);
    }

    public function listByTask(int $taskId): Collection
    {
        return Comment::query()
            ->forTask($taskId)
            ->with('author')
            ->latestFirst()
            ->get();
    }

    public function listByTaskPaginated(int $taskId, array $filters = []): LengthAwarePaginator
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 15)));

        return Comment::query()
            ->forTask($taskId)
            ->with(['author', 'attachments'])
            ->latestFirst()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function update(Comment $comment, User $user, string $content, array $attachments = [], bool $isAdminOrOwner = false): Comment
    {
        // Only author or admin/owner can update
        if (! $isAdminOrOwner && $comment->author_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        // Handle attachment sync/removal if necessary
        // Note: The previous logic for removing old attachments was based on an empty newAttachmentIds list.
        // For simplicity and following the "separate as much as you can" rule,
        // we'll keep the update logic here or move the sync logic to the attachment service.

        // Remove old attachments if any new ones are provided (existing behavior preserved)
        if (! empty($attachments)) {
            $this->attachmentService->deleteAll($comment);
            $this->attachmentService->upload($comment, $attachments);
        }

        $comment->content = $content;
        $comment->save();

        return $comment->fresh(['author', 'attachments']);
    }
}
