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
    public function __construct(private
        CommentAttachmentService $attachmentService
        )
    {
    }

    public function create(Task $task, User $user, string $content, ?int $parentId = null): Comment
    {
        // If parentId is provided, optionally verify it exists and belongs to the same task
        if ($parentId) {
            $parent = Comment::findOrFail($parentId);
            if ($parent->task_id !== $task->id) {
                throw new \Exception('Parent comment belongs to a different task');
            }
        }

        $comment = Comment::create([
            'task_id' => $task->id,
            'author_id' => $user->id,
            'parent_id' => $parentId,
            'content' => $content,
        ]);

        // [NOTIFICATION PLACEHOLDER] - Notify parent author or task participants

        return $comment;
    }

    public function createWithAttachments(Task $task, User $user, string $content, array $attachments = [], ?int $parentId = null): Comment
    {
        $comment = $this->create($task, $user, $content, $parentId);

        if (!empty($attachments)) {
            $this->attachmentService->upload($comment, $attachments);
        }

        return $comment->fresh('attachments');
    }

    public function delete(Comment $comment, User $actor, bool $isAdminOrOwner = false): void
    {
        // check if admin or owner of the task
        if (!$isAdminOrOwner && $comment->author_id !== $actor->id) {
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
        if (!$isAdminOrOwner && $comment->author_id !== $actor->id) {
            throw new \Exception('Unauthorized');
        }

        $this->attachmentService->delete($attachment);
    }

    public function listByTask(int $taskId): Collection
    {
        return Comment::query()
            ->forTask($taskId)
            ->whereNull('parent_id')
            ->with(['author', 'attachments', 'recursiveReplies'])
            ->latestFirst()
            ->get();
    }

    public function listByTaskPaginated(int $taskId, array $filters = []): LengthAwarePaginator
    {
        $page = max(1, (int)($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int)($filters['per_page'] ?? 15)));

        return Comment::query()
            ->forTask($taskId)
            ->whereNull('parent_id')
            ->with(['author', 'attachments', 'recursiveReplies'])
            ->latestFirst()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function update(Comment $comment, User $user, string $content, array $attachments = [], bool $isAdminOrOwner = false): Comment
    {
        // Only author or admin/owner can update
        if (!$isAdminOrOwner && $comment->author_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        // Handle attachment sync
        if (isset($attachments)) {
            $this->attachmentService->sync($comment, $attachments);
        }

        $comment->content = $content;
        $comment->save();

        return $comment->fresh(['author', 'attachments']);
    }
}
