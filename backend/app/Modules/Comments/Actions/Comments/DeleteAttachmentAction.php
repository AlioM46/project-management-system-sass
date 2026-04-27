<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Model\CommentAttachment;
use App\Modules\Comments\Services\CommentAttachmentService;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Services\WorkspaceContextService;

class DeleteAttachmentAction
{
    public function __construct(
        private CommentAttachmentService $attachmentService,
        private WorkspaceContextService $workspaceContextService
    ) {}

    public function execute(int $attachmentId, $user)
    {
        $attachment = CommentAttachment::with('comment')->findOrFail($attachmentId);
        $comment = $attachment->comment;

        // Check if user is admin or owner of the workspace
        $isAdminOrOwner = $this->isAdminOrOwner();

        // Only author or admin/owner can delete attachment
        if (! $isAdminOrOwner && $comment->author_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        $this->attachmentService->delete($attachment);
    }

    private function isAdminOrOwner(): bool
    {
        $membership = $this->workspaceContextService->currentMembership();

        if ($membership && $membership->role && in_array($membership->role->slug, [Role::OWNER_SLUG, Role::ADMIN_SLUG], true)) {
            return true;
        }

        return false;
    }
}
