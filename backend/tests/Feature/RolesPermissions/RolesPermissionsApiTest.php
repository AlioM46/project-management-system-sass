<?php

use App\Models\User;
use App\Modules\RolesPermissions\Actions\ListPermissions;
use App\Modules\Workspace\Actions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeRolesPermissionsApiUser(string $email): User
{
    return User::query()->create([
        'name' => 'Ali Omar',
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createApiWorkspace(User $user, string $name = 'API Workspace')
{
    return app(CreateWorkspace::class)->execute([
        'name' => $name,
    ], $user);
}

it('returns the granular permission catalog through the public endpoint', function () {
    app(ListPermissions::class)->execute();

    $user = makeRolesPermissionsApiUser('permissions-api@example.com');

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->getJson('/api/roles-permissions/permissions');

    $response->assertOk()
        ->assertJsonPath('data.permissions.0.key', 'audit.export')
        ->assertJsonPath('data.permissions.1.key', 'audit.view')
        ->assertJsonPath('data.permissions.32.key', 'workspace.view');
});

it('returns granular workspace roles for the active workspace', function () {
    $user = makeRolesPermissionsApiUser('roles-api@example.com');

    $workspace = createApiWorkspace($user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/roles-permissions/roles');

    $response->assertOk()
        ->assertJsonPath('data.roles.0.name', 'Admin')
        ->assertJsonPath('data.roles.0.permissions.0.key', 'audit.export')
        ->assertJsonPath('data.roles.1.name', 'Member')
        ->assertJsonPath('data.roles.1.permissions.0.key', 'comment.create')
        ->assertJsonPath('data.roles.2.name', 'Owner')
        ->assertJsonPath('data.roles.2.permissions.32.key', 'workspace.view');
});
