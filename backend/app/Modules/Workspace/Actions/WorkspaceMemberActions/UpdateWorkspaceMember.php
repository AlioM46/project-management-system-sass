<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Model\Workspace_Members;

class UpdateWorkspaceMember
{
    public function execute(Workspace_Members $member, array $data): array
    {
        // TODO: Update the targeted member inside the active workspace.
        return ['member' => null];
    }
}
