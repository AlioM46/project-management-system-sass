<?php

namespace App\Modules\Comments\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Model\CommentAttachment;
use App\Modules\Leads\Model\Lead;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CommentService
{
    public function __construct(
        private CommentAttachmentService $attachmentService,
        private MentionService $mentionService,
        private WorkspaceContextService $workspaceContext,
        private AuditLogger $auditLogger,
        private NotificationService $notificationService
    ) {}

    public function create(Lead $lead, User $user, string $content, ?int $parentId = null): Comment
    {
        $parent = null;

        if ($parentId) {
            $parent = Comment::findOrFail($parentId);
            if ($parent->lead_id !== $lead->id) {
                throw new \Exception('Parent comment belongs to a different lead');
            }
        }

        $comment = DB::transaction(function () use ($lead, $user, $parentId, $content): Comment {
            $comment = Comment::create([
                'lead_id' => $lead->id,
                'author_id' => $user->id,
                'parent_id' => $parentId,
                'content' => $content,
            ]);

            $this->auditLogger->record(
                workspace: $lead->workspace,
                action: AuditAction::CommentCreated,
                targetType: AuditTargetType::Comment,
                targetId: $comment->id,
                actor: $user,
                newValues: [
                    'lead_id' => $lead->id,
                    'parent_id' => $parentId,
                    'content' => $content,
                ],
                metadata: [
                    AuditMetadataKey::LeadId->value => $lead->id,
                ]
            );

            return $comment;
        });

        if ($parent && (int) $parent->author_id !== (int) $user->id) {
            $this->notificationService->send(
                $this->workspaceContext->currentWorkspaceId() ?? (int) $lead->workspace_id,
                (int) $parent->author_id,
                NotificationType::COMMENT_REPLIED,
                [
                    'source_type' => 'comment',
                    'source_id' => $comment->id,
                    'parent_comment_id' => $parent->id,
                    'lead_id' => $lead->id,
                    'replied_by_user_id' => $user->id,
                ]
            );
        }

        return $comment;
    }

    public function createWithAttachments(Lead $lead, User $user, string $content, array $attachments = [], ?int $parentId = null): Comment
    {
        return DB::transaction(function () use ($lead, $user, $content, $attachments, $parentId): Comment {
            $comment = $this->create($lead, $user, $content, $parentId);
            $usernames = $this->mentionService->extractUsernames($content);
            $workspaceId = $this->workspaceContext->currentWorkspaceId();
            $users = $this->mentionService->resolveUsers($usernames, $workspaceId);

            $this->mentionService->store(
                users: $users,
                sourceType: 'comment',
                sourceId: $comment->id,
                workspaceId: $workspaceId,
                mentionedBy: $user->id
            );

            if (! empty($attachments)) {
                $this->attachmentService->upload($comment, $attachments);
            }

            return $comment->fresh('attachments');
        });
    }

    public function delete(Comment $comment, User $actor): void
    {
        if ($comment->author_id !== $actor->id) {
            throw new \Exception('Unauthorized');
        }

        DB::transaction(function () use ($comment, $actor): void {
            $oldValues = [
                'lead_id' => $comment->lead_id,
                'parent_id' => $comment->parent_id,
                'content' => $comment->content,
            ];

            $this->attachmentService->deleteAll($comment);
            $comment->delete();
            $this->mentionService->deleteBySource('comment', $comment->id);

            $this->auditLogger->record(
                workspace: $comment->lead->workspace,
                action: AuditAction::CommentDeleted,
                targetType: AuditTargetType::Comment,
                targetId: $comment->id,
                actor: $actor,
                oldValues: $oldValues,
                metadata: [
                    AuditMetadataKey::LeadId->value => $comment->lead_id,
                ]
            );
        });
    }

    public function deleteAttachment(CommentAttachment $attachment, User $actor): void
    {
        if ($attachment->comment->author_id !== $actor->id) {
            throw new \Exception('Unauthorized');
        }

        $this->attachmentService->delete($attachment);
    }

    public function listByLead(int $leadId): Collection
    {
        return Comment::query()
            ->forLead($leadId)
            ->whereNull('parent_id')
            ->with(['author', 'attachments', 'recursiveReplies'])
            ->latestFirst()
            ->get();
    }

    public function listByLeadPaginated(int $leadId, array $filters = []): LengthAwarePaginator
    {
        return Comment::query()
            ->forLead($leadId)
            ->whereNull('parent_id')
            ->with(['author', 'attachments', 'recursiveReplies'])
            ->latestFirst()
            ->paginate(max(1, min(100, (int) ($filters['per_page'] ?? 15))), ['*'], 'page', max(1, (int) ($filters['page'] ?? 1)));
    }

    public function update(Comment $comment, User $user, string $content, ?array $attachments = null): Comment
    {
        if ($comment->author_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        if ($attachments !== null) {
            $this->attachmentService->sync($comment, $attachments);
        }

        return DB::transaction(function () use ($comment, $user, $content): Comment {
            $workspaceId = $this->workspaceContext->currentWorkspaceId();
            $oldValues = ['content' => $comment->content];

            $comment->content = $content;
            $comment->save();

            $this->mentionService->syncForSource(
                content: $content,
                sourceType: 'comment',
                sourceId: $comment->id,
                workspaceId: $workspaceId,
                mentionedBy: $user->id
            );

            if ($oldValues['content'] !== $comment->content) {
                $this->auditLogger->record(
                    workspace: $comment->lead->workspace,
                    action: AuditAction::CommentUpdated,
                    targetType: AuditTargetType::Comment,
                    targetId: $comment->id,
                    actor: $user,
                    oldValues: $oldValues,
                    newValues: ['content' => $comment->content],
                    metadata: [
                        AuditMetadataKey::LeadId->value => $comment->lead_id,
                    ]
                );
            }

            return $comment->fresh(['author', 'attachments']);
        });
    }
}
