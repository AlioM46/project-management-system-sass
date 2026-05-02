<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeProjectAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Project Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records project created audit log through the API', function () {
    $user = makeProjectAuditUser('project-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Project WS'], $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', [
            'name' => 'Audit Project',
            'description' => 'For audit test',
        ]);

    $response->assertCreated();

    $projectId = $response->json('data.project.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::ProjectCreated->value)
        ->where('target_id', $projectId)
        ->exists())->toBeTrue();
});

