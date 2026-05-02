<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeWorkspaceAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Workspace Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records workspace created audit log', function () {
    $user = makeWorkspaceAuditUser('workspace-audit@example.com');

    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Audit WS'], $user);

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::WorkspaceCreated->value)
        ->where('target_type', AuditTargetType::Workspace->value)
        ->where('target_id', $workspace->id)
        ->exists())->toBeTrue();
});

it('records workspace archived audit log through the API', function () {
    $user = makeWorkspaceAuditUser('workspace-archive@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Archive WS'], $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->deleteJson('/api/workspaces/current');

    $response->assertOk();

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::WorkspaceDeleted->value)
        ->exists())->toBeTrue();
});

