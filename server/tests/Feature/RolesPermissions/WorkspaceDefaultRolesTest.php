<?php

use App\Models\User;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\RolesPermissions\Services\WorkspaceRoleProvisioningService;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeRolesPermissionsUser(string $email): User
{
    return User::query()->create([
        'name' => 'Ali Omar',
        'username' => 'aliomar',
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createWorkspaceForUser(User $user, string $name = 'Delivery Workspace')
{
    return app(CreateWorkspace::class)->execute([
        'name' => $name,
    ], $user);
}

function workspaceRolesFor(int $workspaceId)
{
    return Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspaceId)
        ->with(['permissions' => fn($query) => $query->orderBy('key')])
        ->orderBy('slug')
        ->get()
        ->keyBy('slug');
}

function workspaceMembershipFor(int $workspaceId, int $userId): Workspace_Members
{
    return Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspaceId)
        ->where('user_id', $userId)
        ->firstOrFail();
}

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
        'course.archive',
        'course.create',
        'course.delete',
        'course.restore',
        'course.update',
        'course.view',
        'lead.assign',
        'lead.change_stage',
        'lead.create',
        'lead.delete',
        'lead.update',
        'lead.view',
        'member.invite',
        'member.remove',
        'member.update',
        'member.view',
        'report.create',
        'report.export',
        'report.view',
        'role.assign',
        'role.create',
        'role.delete',
        'role.update',
        'role.view',
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
    $user = makeRolesPermissionsUser('owner@example.com');

    $workspace = createWorkspaceForUser($user);

    $roles = workspaceRolesFor($workspace->id);
    $membership = workspaceMembershipFor($workspace->id, $user->id);

    expect($roles->keys()->all())->toBe(['admin', 'member', 'owner'])
        ->and($roles['owner']->name)->toBe('Owner')
        ->and($roles['owner']->is_system)->toBeTrue()
        ->and($roles['owner']->is_editable)->toBeFalse()
        ->and($roles['owner']->is_deletable)->toBeFalse()
        ->and($roles['admin']->is_system)->toBeTrue()
        ->and($roles['member']->is_system)->toBeTrue()
        ->and($roles['owner']->permissions->pluck('key')->all())->toBe(expectedGranularPermissionKeys())
        ->and($membership->role_id)->toBe($roles['owner']->id);
});

it('re-provisions system roles idempotently and repairs protected defaults', function () {
    $user = makeRolesPermissionsUser('repair-owner@example.com');
    $workspace = createWorkspaceForUser($user);

    $adminRole = Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspace->id)
        ->where('slug', 'admin')
        ->firstOrFail();

    $adminRole->update([
        'name' => 'Legacy Admin',
        'description' => 'Broken admin role',
        'is_system' => false,
        'is_editable' => true,
        'is_deletable' => true,
    ]);
    $adminRole->permissions()->sync([]);

    app(WorkspaceRoleProvisioningService::class)->provisionForWorkspace($workspace);
    app(WorkspaceRoleProvisioningService::class)->provisionForWorkspace($workspace);

    $roles = workspaceRolesFor($workspace->id);

    expect($roles)->toHaveCount(3)
        ->and($roles['admin']->name)->toBe('Admin')
        ->and($roles['admin']->is_system)->toBeTrue()
        ->and($roles['admin']->is_editable)->toBeFalse()
        ->and($roles['admin']->is_deletable)->toBeFalse()
        ->and($roles['admin']->permissions->pluck('key')->contains('role.assign'))->toBeTrue()
        ->and($roles['owner']->slug)->toBe('owner')
        ->and($roles['member']->slug)->toBe('member');
});
