<?php

use App\Models\User;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeWorkspaceMemberRouteUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('shows one workspace member by id without implicit model binding failures', function () {
    $owner = makeWorkspaceMemberRouteUser('Owner User', 'owner-show@example.com');
    $member = makeWorkspaceMemberRouteUser('Member User', 'member-show@example.com');

    $workspace = app(CreateWorkspace::class)->execute([
        'name' => 'Workspace Member Route Test',
    ], $owner);

    $memberRoleId = Role::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('name', 'Member')
        ->value('id');

    $membership = Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $member->id,
        'role_id' => $memberRoleId,
        'joined_at' => now(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson("/api/workspaces/members/{$membership->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Workspace member retrieved successfully.')
        ->assertJsonPath('data.member.id', $membership->id)
        ->assertJsonPath('data.member.user.email', 'member-show@example.com')
        ->assertJsonPath('data.member.role.name', 'Member');
});
