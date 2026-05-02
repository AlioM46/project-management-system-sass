<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeRoleAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Role Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records role created audit log through the API', function () {
    $user = makeRoleAuditUser('role-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Role WS'], $user);

    Permission::query()->count();

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'Support',
            'slug' => 'support',
        ]);

    $response->assertCreated();

    $roleId = $response->json('data.role.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::RoleCreated->value)
        ->where('target_id', $roleId)
        ->exists())->toBeTrue();
});

