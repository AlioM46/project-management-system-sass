<?php

use App\Models\User;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Actions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function expectedGranularPermissionKeys(): array
{
    return [
        'audit.export',
        'audit.view',
        'comment.create',
        'comment.delete',
        'comment.moderate',
        'comment.update',
        'comment.view',
        'member.invite',
        'member.remove',
        'member.update',
        'member.view',
        'project.archive',
        'project.create',
        'project.delete',
        'project.update',
        'project.view',
        'report.create',
        'report.export',
        'report.view',
        'role.assign',
        'role.create',
        'role.delete',
        'role.update',
        'role.view',
        'task.assign',
        'task.change_status',
        'task.create',
        'task.delete',
        'task.update',
        'task.view',
        'workspace.delete',
        'workspace.update',
        'workspace.view',
    ];
}

it('syncs the predefined system permissions catalog', function () {
    $permissions = app(ListPermissions::class)->execute();

    expect($permissions->pluck('key')->all())->toBe(expectedGranularPermissionKeys())
        ->and(Permission::query()->where('key', 'like', '%.*')->count())->toBe(0);
});

it('creates default workspace roles and assigns the creator as owner', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'owner@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = app(CreateWorkspace::class)->execute([
        'name' => 'Delivery Workspace',
    ], $user);

    $roles = Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspace->id)
        ->with([
            'permissions' => fn ($query) => $query->orderBy('key'),
        ])
        ->orderBy('name')
        ->get()
        ->keyBy('name');

    $membership = Workspace_Members::query()
        ->where('workspace_id', $workspace->id)
        ->where('user_id', $user->id)
        ->firstOrFail();

    expect($roles->keys()->all())->toBe(['Admin', 'Member', 'Owner'])
        ->and($roles['Owner']->is_system)->toBeTrue()
        ->and($roles['Owner']->permissions->pluck('key')->all())->toBe(expectedGranularPermissionKeys())
        ->and($membership->role_id)->toBe($roles['Owner']->id);
});

it('replaces legacy wildcard permissions and mappings during reprovisioning', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'legacy-owner@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = app(CreateWorkspace::class)->execute([
        'name' => 'Legacy Workspace',
    ], $user);

    $ownerRole = Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspace->id)
        ->where('name', 'Owner')
        ->firstOrFail();

    $membership = Workspace_Members::query()
        ->where('workspace_id', $workspace->id)
        ->where('user_id', $user->id)
        ->firstOrFail();

    foreach ([
        'workspace.*',
        'member.*',
        'role.*',
        'project.*',
        'task.*',
        'comment.*',
        'audit.*',
        'report.*',
    ] as $legacyKey) {
        Permission::query()->create([
            'key' => $legacyKey,
            'name' => 'Legacy '.$legacyKey,
            'description' => 'Legacy wildcard permission.',
        ]);
    }

    $ownerRole->permissions()->sync(
        Permission::query()
            ->where('key', 'like', '%.*')
            ->get()
            ->mapWithKeys(fn (Permission $permission): array => [
                $permission->id => ['permission_key' => $permission->key],
            ])
            ->all()
    );

    app(WorkspaceRoleProvisioningService::class)->provisionForWorkspace($workspace);

    $ownerRole->refresh()->load([
        'permissions' => fn ($query) => $query->orderBy('key'),
    ]);
    $membership->refresh();

    expect(Permission::query()->where('key', 'like', '%.*')->exists())->toBeFalse()
        ->and($ownerRole->id)->toBe($membership->role_id)
        ->and($ownerRole->permissions->pluck('key')->all())->toBe(expectedGranularPermissionKeys())
        ->and($ownerRole->rolePermissions()->where('permission_key', 'like', '%.*')->count())->toBe(0);
});
