<?php

use App\Models\User;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeLeaveWorkspaceUser(string $email, string $name): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace(' ', '', $name)),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createLeaveWorkspace(User $user, string $name = 'Leave Workspace Test'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

it('preserves owner transfer behavior with slug-based system role lookup', function () {
    $owner = makeLeaveWorkspaceUser('leave-owner@example.com', 'Leave Owner');
    $admin = makeLeaveWorkspaceUser('leave-admin@example.com', 'Leave Admin');
    $workspace = createLeaveWorkspace($owner);

    $adminRole = Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspace->id)
        ->where('slug', 'admin')
        ->firstOrFail();

    Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->create([
            'workspace_id' => $workspace->id,
            'user_id' => $admin->id,
            'role_id' => $adminRole->id,
            'joined_at' => now()->addMinute(),
        ]);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/workspaces/current/leave');

    $response->assertOk()
        ->assertJsonPath('data.action', 'transferred_and_left')
        ->assertJsonPath('data.workspace.owner.id', $admin->id);

    $workspace->refresh();

    $ownerRole = Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspace->id)
        ->where('slug', 'owner')
        ->firstOrFail();

    $newOwnerMembership = Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('user_id', $admin->id)
        ->firstOrFail();

    $oldOwnerMembership = Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('user_id', $owner->id)
        ->first();

    expect($workspace->created_by_user_id)->toBe($admin->id)
        ->and($newOwnerMembership->role_id)->toBe($ownerRole->id)
        ->and($oldOwnerMembership)->toBeNull();
});
