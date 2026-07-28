<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Model\LeadAssignment;
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

it('records a course creation audit log only after a successful create request', function () {
    $user = makeAuditUser('audit-course@example.com');
    $workspace = createAuditWorkspace($user);

    $beforeFailureCount = AuditLog::query()->count();

    $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/courses', ['name' => ''])
        ->assertUnprocessable();

    expect(AuditLog::query()->count())->toBe($beforeFailureCount);

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/courses', [
            'name' => 'Delivery Plan',
            'description' => 'Plan academy onboarding',
            'price' => 1200,
            'duration_hours' => 12,
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.course.name', 'Delivery Plan');

    $courseId = $response->json('data.course.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::CourseCreated->value)
        ->where('target_type', AuditTargetType::Course->value)
        ->where('target_id', $courseId)
        ->exists())->toBeTrue();
});

it('lists audit logs only for the active workspace and supports filters', function () {
    $user = makeAuditUser('audit-list@example.com');
    $workspaceA = createAuditWorkspace($user, 'Workspace A');
    $workspaceB = createAuditWorkspace($user, 'Workspace B');

    app(AuditLogger::class)->record(
        workspace: $workspaceA,
        action: AuditAction::CourseCreated,
        targetType: AuditTargetType::Course,
        targetId: 101,
        actor: $user,
        newValues: ['name' => 'Workspace A course']
    );

    app(AuditLogger::class)->record(
        workspace: $workspaceB,
        action: AuditAction::CourseCreated,
        targetType: AuditTargetType::Course,
        targetId: 202,
        actor: $user,
        newValues: ['name' => 'Workspace B course']
    );

    app(AuditLogger::class)->record(
        workspace: $workspaceA,
        action: AuditAction::LeadCreated,
        targetType: AuditTargetType::Lead,
        targetId: 303,
        actor: $user,
        newValues: ['title' => 'Lead']
    );

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->getJson('/api/audit-logs?event_type=course_created&target_type=course&per_page=1');

    $response->assertOk()
        ->assertJsonPath('data.count', 1)
        ->assertJsonPath('data.audit_logs.0.workspace_id', $workspaceA->id)
        ->assertJsonPath('data.audit_logs.0.event_type', AuditAction::CourseCreated->value)
        ->assertJsonPath('data.audit_logs.0.target_id', 101)
        ->assertJsonPath('meta.pagination.total', 1);
});

it('filters audit logs by assignee and date range', function () {
    $user = makeAuditUser('audit-assignee@example.com');
    $assignee = makeAuditUser('lead-owner@example.com');
    $workspace = createAuditWorkspace($user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Audit Filters Course',
        'description' => null,
        'price' => 500,
        'duration_hours' => 8,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'audit filters course',
    ]);

    $stage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'Qualified',
        'position' => 1,
        'is_success' => false,
    ]);

    $leadResponse = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $course->id,
            'stage_id' => $stage->id,
            'title' => 'Audit Filter Lead',
        ]);

    $leadId = $leadResponse->json('data.lead.id');

    LeadAssignment::query()->create([
        'lead_id' => $leadId,
        'user_id' => $assignee->id,
        'assigned_by_user_id' => $user->id,
        'created_at' => now(),
    ]);

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson(sprintf(
            '/api/audit-logs?assignee_user_id=%d&from=%s&to=%s',
            $assignee->id,
            now()->toDateString(),
            now()->toDateString()
        ));

    $response->assertOk()
        ->assertJsonPath('meta.pagination.total', 1)
        ->assertJsonPath('data.audit_logs.0.target_id', $leadId)
        ->assertJsonPath('data.audit_logs.0.event_type', AuditAction::LeadCreated->value);
});

it('records lead lifecycle audit events through the leads api', function () {
    $user = makeAuditUser('audit-lead@example.com');
    $workspace = createAuditWorkspace($user);

    $courseResponse = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/courses', [
            'name' => 'Lead Audit Course',
        ]);

    $courseResponse->assertCreated();
    $courseId = $courseResponse->json('data.course.id');

    $newStage = Stage::query()
        ->where('course_id', $courseId)
        ->where('name', 'New Inquiry')
        ->firstOrFail();

    $wonStage = Stage::query()
        ->where('course_id', $courseId)
        ->where('name', 'Won')
        ->firstOrFail();

    $leadResponse = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $courseId,
            'stage_id' => $newStage->id,
            'title' => 'Audit lead',
            'description' => 'Created for audit coverage',
        ]);

    $leadResponse->assertCreated()
        ->assertJsonPath('data.lead.title', 'Audit lead');

    $leadId = $leadResponse->json('data.lead.id');

    $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/leads/{$leadId}", [
            'stage_id' => $wonStage->id,
        ])
        ->assertOk();

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('event_type', AuditAction::LeadCreated->value)
        ->where('target_id', $leadId)
        ->exists())->toBeTrue()
        ->and(AuditLog::query()
            ->where('workspace_id', $workspace->id)
            ->where('event_type', AuditAction::LeadStageChanged->value)
            ->where('target_id', $leadId)
            ->exists())->toBeTrue();
});

it('exports filtered audit logs to csv and records the export event', function () {
    $user = makeAuditUser('audit-export@example.com');
    $workspace = createAuditWorkspace($user);

    Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Export Course',
        'description' => null,
        'price' => 875,
        'duration_hours' => 11,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'export course',
    ]);

    app(AuditLogger::class)->record(
        workspace: $workspace,
        action: AuditAction::CourseCreated,
        targetType: AuditTargetType::Course,
        targetId: 404,
        actor: $user,
        newValues: ['name' => 'Export Course']
    );

    $response = $this->withToken(auditToken($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->get('/api/audit-logs/export?event_type=course_created');

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())
        ->toContain('course_created')
        ->not->toContain('workspace_created');

    $exportLog = AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::AuditExported->value)
        ->first();

    expect($exportLog)->not->toBeNull()
        ->and($exportLog->metadata['exported_row_count'])->toBe(1)
        ->and($exportLog->metadata['filters']['event_type'])->toBe(AuditAction::CourseCreated->value);
});
