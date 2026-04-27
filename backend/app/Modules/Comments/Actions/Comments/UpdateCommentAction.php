<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Services\CommentService;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Services\WorkspaceContextService;

class UpdateCommentAction
{
    public function __construct(private CommentService $service, private WorkspaceContextService $workspaceContextService
    ) {}

    public function execute(int $commentId, $user, string $content, array $attachments = [])
    {
        $comment = Comment::with('task')->findOrFail($commentId);

        // Check if user is admin or owner of the workspace
        $isAdminOrOwner = $this->isAdminOrOwner();

        return $this->service->update($comment, $user, $content, $attachments, $isAdminOrOwner);
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
