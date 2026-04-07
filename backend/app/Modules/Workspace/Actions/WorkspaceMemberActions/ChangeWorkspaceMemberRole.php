<?php

namespace App\Modules\Workspace\Actions\WorkspaceMemberActions;

use App\Modules\Workspace\Model\Workspace_Members;

class ChangeWorkspaceMemberRole
{
    public function execute(Workspace_Members $member, array $data): array
    {
        // Flow
        // 
    $currentMemberRoleId = $member->role_id;
    $newRoleId = $data["role_id"];
    return ['member' => null];
    }
}
