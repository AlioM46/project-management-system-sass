<?php

namespace App\Modules\RolesPermissions\Actions;

use App\Modules\RolesPermissions\Model\Role;
use Illuminate\Database\Eloquent\Collection;

/**
 * Use-case: return roles for the active workspace.
 *
 * Role uses the workspace tenant scope, so this query automatically becomes:
 * - select roles where workspace_id = current_workspace_id
 */
class ListWorkspaceRoles
{
    /**
     * Load roles with their permissions.
     *
     * Result example:
     * [
     *   Role { name: "Admin", permissions: [...] },
     *   Role { name: "Member", permissions: [...] },
     *   Role { name: "Owner", permissions: [...] },
     * ]
     */
    public function execute(): Collection
    {
        return Role::query()
            ->with(['permissions' => fn ($query) => $query->orderBy('key')])
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();
    }
}
