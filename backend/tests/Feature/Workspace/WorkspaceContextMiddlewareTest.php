<?php

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeWorkspaceContextUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('returns the regular success response shape for resolved workspace context', function () {
    $user = makeWorkspaceContextUser('Ali Omar', 'ali@example.com');

    $workspace = Workspace::query()->create([
        'name' => 'Product Workspace',
        'created_by_user_id' => $user->id,
    ]);

    $membership = Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/_test/workspace-context');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Workspace context resolved successfully.')
        ->assertJsonPath('data.context.workspace_id', $workspace->id)
        ->assertJsonPath('data.context.member_id', $membership->id)
        ->assertJsonPath('data.context.role_id', null)
        ->assertJsonPath('data.request_workspace_id', $workspace->id)
        ->assertJsonPath('meta', []);
});

it('returns a business error when the workspace header is missing', function () {
    $user = makeWorkspaceContextUser('Ali Omar', 'ali@example.com');

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->getJson('/api/_test/workspace-context');

    $response->assertStatus(400)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'WORKSPACE_CONTEXT_MISSING_HEADER')
        ->assertJsonPath('error.message', 'Missing X-Workspace-Id header.')
        ->assertJsonPath('error.meta.header', 'X-Workspace-Id');
});

it('returns a business error when the workspace header format is invalid', function () {
    $user = makeWorkspaceContextUser('Ali Omar', 'ali@example.com');

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', 'abc')
        ->getJson('/api/_test/workspace-context');

    $response->assertStatus(400)
        ->assertJsonPath('error.code', 'WORKSPACE_CONTEXT_INVALID_HEADER')
        ->assertJsonPath('error.message', 'Invalid X-Workspace-Id header format.')
        ->assertJsonPath('error.meta.header', 'X-Workspace-Id');
});

it('returns a business error when the workspace does not exist', function () {
    $user = makeWorkspaceContextUser('Ali Omar', 'ali@example.com');

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', '9999')
        ->getJson('/api/_test/workspace-context');

    $response->assertStatus(404)
        ->assertJsonPath('error.code', 'WORKSPACE_CONTEXT_NOT_FOUND')
        ->assertJsonPath('error.message', 'Workspace not found.')
        ->assertJsonPath('error.meta.workspace_id', 9999);
});

it('returns a business error when the user is not a workspace member', function () {
    $member = makeWorkspaceContextUser('Member User', 'member@example.com');
    $outsider = makeWorkspaceContextUser('Ali Omar', 'ali@example.com');

    $workspace = Workspace::query()->create([
        'name' => 'Restricted Workspace',
        'created_by_user_id' => $member->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $member->id,
        'role_id' => null,
    ]);

    $response = $this->withToken(JWTAuth::fromUser($outsider))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/_test/workspace-context');

    $response->assertStatus(403)
        ->assertJsonPath('error.code', 'WORKSPACE_CONTEXT_FORBIDDEN')
        ->assertJsonPath('error.message', 'You are not a member of this workspace.')
        ->assertJsonPath('error.meta.workspace_id', $workspace->id);
});
