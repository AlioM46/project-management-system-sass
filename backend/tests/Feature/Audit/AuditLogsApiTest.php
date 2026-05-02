<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Projects\Model\Project;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createAuditWorkspace(User $user, string $name = 'Audit Workspace'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

function auditToken(User $user): string
{
    return JWTAuth::fromUser($user);
}

it('records a project creation audit log only after a successful create request', function () {
    $user = makeAuditUser('audit-project@example.com');
    $workspace = createAuditWorkspace($user);

    $beforeFailureCount = AuditLog::query()->count();

    $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', ['name' => ''])
        ->assertUnprocessable();

    expect(AuditLog::query()->count())->toBe($beforeFailureCount);

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', [
            'name' => 'Delivery Plan',
            'description' => 'Plan project work',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.project.name', 'Delivery Plan');

    $projectId = $response->json('data.project.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::ProjectCreated->value)
        ->where('target_type', AuditTargetType::Project->value)
        ->where('target_id', $projectId)
        ->exists())->toBeTrue();
});

it('lists audit logs only for the active workspace and supports filters', function () {
    $user = makeAuditUser('audit-list@example.com');
    $workspaceA = createAuditWorkspace($user, 'Workspace A');
    $workspaceB = createAuditWorkspace($user, 'Workspace B');

    app(AuditLogger::class)->record(
        workspace: $workspaceA,
        action: AuditAction::ProjectCreated,
        targetType: AuditTargetType::Project,
        targetId: 101,
        actor: $user,
        newValues: ['name' => 'Workspace A project']
    );

    app(AuditLogger::class)->record(
        workspace: $workspaceB,
        action: AuditAction::ProjectCreated,
        targetType: AuditTargetType::Project,
        targetId: 202,
        actor: $user,
        newValues: ['name' => 'Workspace B project']
    );

    app(AuditLogger::class)->record(
        workspace: $workspaceA,
        action: AuditAction::TaskCreated,
        targetType: AuditTargetType::Task,
        targetId: 303,
        actor: $user,
        newValues: ['title' => 'Task']
    );

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->getJson('/api/audit-logs?action=project_created&target_type=project&per_page=1');

    $response->assertOk()
        ->assertJsonPath('data.count', 1)
        ->assertJsonPath('data.audit_logs.0.workspace_id', $workspaceA->id)
        ->assertJsonPath('data.audit_logs.0.action', AuditAction::ProjectCreated->value)
        ->assertJsonPath('data.audit_logs.0.target_id', 101)
        ->assertJsonPath('meta.pagination.total', 1);
});

it('records task lifecycle audit events through the task api', function () {
    $user = makeAuditUser('audit-task@example.com');
    $workspace = createAuditWorkspace($user);

    $projectResponse = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', [
            'name' => 'Task Audit Project',
        ]);

    $projectResponse->assertCreated();

    $taskResponse = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/tasks', [
            'project_id' => $projectResponse->json('data.project.id'),
            'title' => 'Audit task',
            'description' => 'Created for audit coverage',
        ]);

    $taskResponse->assertCreated()
        ->assertJsonPath('data.task.title', 'Audit task');

    $taskId = $taskResponse->json('data.task.id');

    $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/tasks/{$taskId}", [
            'status' => 'IN_PROGRESS',
        ])
        ->assertOk();

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('action', AuditAction::TaskCreated->value)
        ->where('target_id', $taskId)
        ->exists())->toBeTrue()
        ->and(AuditLog::query()
            ->where('workspace_id', $workspace->id)
            ->where('action', AuditAction::TaskStatusChanged->value)
            ->where('target_id', $taskId)
            ->exists())->toBeTrue();
});

it('exports filtered audit logs to csv and records the export event', function () {
    $user = makeAuditUser('audit-export@example.com');
    $workspace = createAuditWorkspace($user);

    Project::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Export Project',
        'description' => null,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'export project',
    ]);

    app(AuditLogger::class)->record(
        workspace: $workspace,
        action: AuditAction::ProjectCreated,
        targetType: AuditTargetType::Project,
        targetId: 404,
        actor: $user,
        newValues: ['name' => 'Export Project']
    );

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->get('/api/audit-logs/export?action=project_created');

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())
        ->toContain('project_created')
        ->not->toContain('workspace_created');

    $exportLog = AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('action', AuditAction::AuditExported->value)
        ->first();

    expect($exportLog)->not->toBeNull()
        ->and($exportLog->metadata['exported_row_count'])->toBe(1)
        ->and($exportLog->metadata['filters']['action'])->toBe(AuditAction::ProjectCreated->value);
});
