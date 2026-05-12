<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeTaskAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Task Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records task status change audit log through the API', function () {
    $user = makeTaskAuditUser('task-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Task WS'], $user);

    $projectResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', ['name' => 'Task Project']);
    $projectResponse->assertCreated();

    $taskResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/tasks', [
            'project_id' => $projectResponse->json('data.project.id'),
            'title' => 'Audit Task',
        ]);
    $taskResponse->assertCreated();

    $taskId = $taskResponse->json('data.task.id');

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/tasks/{$taskId}", ['status' => 'IN_PROGRESS'])
        ->assertOk();

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('event_type', AuditAction::TaskStatusChanged->value)
        ->where('target_id', $taskId)
        ->exists())->toBeTrue();
});

