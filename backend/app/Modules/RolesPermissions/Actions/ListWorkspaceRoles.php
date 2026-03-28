<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Model\Role;
use Illuminate\Database\Eloquent\Collection;

class ListWorkspaceRoles
{
    public function execute(): Collection
    {
        return Role::query()
            ->with([
                'permissions' => fn ($query) => $query->orderBy('key'),
            ])
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
    }
}
