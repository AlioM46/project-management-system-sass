<?php

namespace App\Modules\Workspace\Actions;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Support\Facades\DB;

class CreateWorkspace
{
    public function execute(array $data, User $user): Workspace
    {
        return DB::transaction(function () use ($data, $user) {
            $workspace = Workspace::query()->create([
                'name' => $data['name'],
                'created_by_user_id' => $user->id,
            ]);

            Workspace_Members::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role_id' => null,
                'joined_at' => now(),
            ]);

            return $workspace->load([
                'owner:id,name,email',
                'members.user:id,name,email',
            ])->loadCount('members');
        });
    }
}
