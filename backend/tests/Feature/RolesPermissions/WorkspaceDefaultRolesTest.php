<?php

use App\Models\User;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeRolesPermissionsUser(string $email): User
{
    return User::query()->create([
        'name' => 'Ali Omar',
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
        ->with(['permissions' => fn ($query) => $query->orderBy('key')])
        ->orderBy('name')
        ->get()
        ->keyBy('name');
}

function workspaceMembershipFor(int $workspaceId, int $userId): Workspace_Members
{
    return Workspace_Members::query()
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
    $user = makeRolesPermissionsUser('owner@example.com');

    $workspace = createWorkspaceForUser($user);

    $roles = workspaceRolesFor($workspace->id);
    $membership = workspaceMembershipFor($workspace->id, $user->id);

    expect($roles->keys()->all())->toBe(['Admin', 'Member', 'Owner'])
        ->and($roles['Owner']->is_system)->toBeTrue()
        ->and($roles['Owner']->permissions->pluck('key')->all())->toBe(expectedGranularPermissionKeys())
        ->and($membership->role_id)->toBe($roles['Owner']->id);
});
