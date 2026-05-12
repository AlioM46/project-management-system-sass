<?php

namespace App\Modules\RolesPermissions\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\RolesPermissions\Exceptions\RolesPermissionsException;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WorkspaceRoleManagementService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly PermissionCatalogService $permissionCatalogService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }

    public function resolveWorkspaceRole(Workspace $workspace, int $roleId): Role
    {
        $role = $this->roleQueryForWorkspace($workspace)
            ->whereKey($roleId)
            ->first();

        if ($role === null) {
            throw RolesPermissionsException::roleNotFound($roleId, $workspace->id);
        }

        return $this->loadRoleDetails($role);
    }

    public function createCustomRole(Workspace $workspace, array $data, User $actor): Role
    {
        $name = trim((string) $data['name']);
        $slug = strtolower(trim((string) $data['slug']));

        $this->guardRoleIdentityAllowed($name, $slug);

        $role = DB::transaction(function () use ($workspace, $name, $slug, $data, $actor): Role {
            $role = Role::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->create([
                    'workspace_id' => $workspace->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => isset($data['description']) ? trim((string) $data['description']) : null,
                    'is_system' => false,
                    'is_editable' => true,
                    'is_deletable' => true,
                ]);

            $this->auditLogger->record(
                workspace: $workspace,
                action: AuditAction::RoleCreated,
                targetType: AuditTargetType::Role,
                targetId: $role->id,
                actor: $actor,
                newValues: [
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                ]
            );

            return $role;
        });

        return $this->loadRoleDetails($role);
    }

    public function updateCustomRole(Role $role, array $data, User $actor): Role
    {
        $this->guardRoleEditable($role);

        $oldValues = [
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
        ];

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            $this->guardRoleIdentityAllowed($name, $role->slug);
            $role->name = $name;
        }

        if (array_key_exists('slug', $data)) {
            $slug = strtolower(trim((string) $data['slug']));
            $this->guardRoleIdentityAllowed((string) $role->name, $slug);
            $role->slug = $slug;
        }

        if (array_key_exists('description', $data)) {
            $description = $data['description'];
            $role->description = $description !== null ? trim((string) $description) : null;
        }

        $newValues = [
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
        ];

        if ($oldValues !== $newValues) {
            DB::transaction(function () use ($role, $actor, $oldValues, $newValues): void {
                $role->save();

                $this->auditLogger->record(
                    workspace: $role->workspace,
                    action: AuditAction::RoleUpdated,
                    targetType: AuditTargetType::Role,
                    targetId: $role->id,
                    actor: $actor,
                    oldValues: $oldValues,
                    newValues: $newValues
                );
            });
        }

        return $this->loadRoleDetails($role->fresh());
    }

    public function deleteCustomRole(Role $role, User $actor): void
    {
        $this->guardRoleDeletable($role);

        $memberCount = $this->assignedMemberCount($role);

        if ($memberCount > 0) {
            throw RolesPermissionsException::roleStillAssigned($role->id, $role->workspace_id, $memberCount);
        }
        // 🔥 What detach() does
        // $role->permissions()->detach();

        // 👉 Deletes rows from the pivot table:

        // DELETE FROM role_permission
        // WHERE role_id = ?

        //         roles:
        //   id: 1 (Admin)

        // permissions:
        //   id: 10 (edit)
        //   id: 11 (delete)

        // role_permission:
        //   (1,10) -> deleted
        //   (1,11) -> deleted
        $oldValues = [
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
        ];

        DB::transaction(function () use ($role, $actor, $oldValues): void {
            $role->permissions()->detach();
            $role->delete();

            $this->auditLogger->record(
                workspace: $role->workspace,
                action: AuditAction::RoleDeleted,
                targetType: AuditTargetType::Role,
                targetId: $role->id,
                actor: $actor,
                oldValues: $oldValues
            );
        });
    }

    public function replacePermissions(Role $role, array $permissionKeys, User $actor): Role
    {
        $this->guardRoleEditable($role);

        $normalizedKeys = collect($permissionKeys)
            ->map(fn ($key): string => trim((string) $key))
            ->filter(fn (string $key): bool => $key !== '')
            ->unique()
            ->values()
            ->all();

        $permissions = Permission::query()
            ->whereIn('key', $normalizedKeys)
            ->orderBy('key')
            ->get()
            ->keyBy('key');

        // array_diff() compares the values of two arrays
        // and returns an array containing the values from the first array
        // that are not present in the second array.
        // In this case, it is used to find any permission keys that were provided in $normalizedKeys
        // but do not exist in the $permissions collection retrieved from the database.
        // -- To check if provided permissions are exist in the system or not
        $invalidKeys = array_values(array_diff($normalizedKeys, $permissions->keys()->all()));

        if ($invalidKeys !== []) {
            throw RolesPermissionsException::invalidPermissionKeys($invalidKeys);
        }

        $this->guardPermissionGrantAllowed($role->workspace, $normalizedKeys, $actor);

        $oldPermissionKeys = $role->permissions()
            ->orderBy('key')
            ->pluck('key')
            ->all();

        DB::transaction(function () use ($role, $normalizedKeys, $permissions, $actor, $oldPermissionKeys): void {
            $role->permissions()->sync($this->permissionSyncData($normalizedKeys, $permissions));

            $newPermissionKeys = $role->permissions()
                ->orderBy('key')
                ->pluck('key')
                ->all();

            if ($oldPermissionKeys === $newPermissionKeys) {
                return;
            }

            $this->auditLogger->record(
                workspace: $role->workspace,
                action: AuditAction::RolePermissionsUpdated,
                targetType: AuditTargetType::Role,
                targetId: $role->id,
                actor: $actor,
                oldValues: ['permissions' => $oldPermissionKeys],
                newValues: ['permissions' => $newPermissionKeys]
            );
        });

        return $this->loadRoleDetails($role->fresh());
    }

    public function loadRoleDetails(Role $role): Role
    {
        return $role->load([
            'permissions' => fn ($query) => $query->orderBy('key'),
        ])->loadCount([
            'workspaceMembers as member_count',
        ]);
    }

    public function roleQueryForWorkspace(Workspace $workspace): Builder
    {
        return Role::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id);
    }

    private function guardRoleIdentityAllowed(string $name, string $slug): void
    {
        if ($this->permissionCatalogService->isReservedRoleName($name)) {
            throw RolesPermissionsException::reservedRoleName($name);
        }

        if ($this->permissionCatalogService->isReservedRoleSlug($slug)) {
            throw RolesPermissionsException::reservedRoleSlug($slug);
        }
    }

    private function guardRoleEditable(Role $role): void
    {
        if (! $role->is_editable) {
            throw RolesPermissionsException::systemRoleNotEditable($role->id, $role->workspace_id);
        }
    }

    private function guardRoleDeletable(Role $role): void
    {
        if (! $role->is_deletable) {
            throw RolesPermissionsException::systemRoleNotDeletable($role->id, $role->workspace_id);
        }
    }

    private function assignedMemberCount(Role $role): int
    {
        return $role->workspaceMembers()->count();
    }

    private function guardPermissionGrantAllowed(Workspace $workspace, array $permissionKeys, User $actor): void
    {
        if ((int) $workspace->created_by_user_id === (int) $actor->id) {
            return;
        }

        $actorMembership = $actor->workspaceMemberships()
            ->where('workspace_id', $workspace->id)
            ->with(['role.permissions:id,key'])
            ->first();

        $actorPermissionKeys = $actorMembership?->role?->permissions
            ? $actorMembership->role->permissions->pluck('key')->all()
            : [];

        $unauthorizedKeys = array_values(array_diff($permissionKeys, $actorPermissionKeys));

        if ($unauthorizedKeys !== []) {
            throw RolesPermissionsException::permissionGrantForbidden($unauthorizedKeys, $workspace->id);
        }
    }

    private function permissionSyncData(array $permissionKeys, Collection $permissions): array
    {
        $syncData = [];

        foreach ($permissionKeys as $permissionKey) {
            $permission = $permissions->get($permissionKey);

            if ($permission === null) {
                continue;
            }

            $syncData[$permission->id] = [
                'permission_key' => $permission->key,
            ];
        }

        return $syncData;
    }
}
