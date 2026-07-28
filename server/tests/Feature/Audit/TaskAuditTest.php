<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeLeadAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Lead Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records lead stage change audit log through the API', function () {
    $user = makeLeadAuditUser('lead-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Lead WS'], $user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Driving Fundamentals',
        'description' => null,
        'price' => 600,
        'duration_hours' => 8,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'driving fundamentals',
    ]);

    $newStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'New Inquiry',
        'position' => 1,
        'is_success' => false,
    ]);

    $qualifiedStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'Qualified',
        'position' => 2,
        'is_success' => false,
    ]);

    $leadResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $course->id,
            'stage_id' => $newStage->id,
            'title' => 'Audit Lead',
        ]);
    $leadResponse->assertCreated();

    $leadId = $leadResponse->json('data.lead.id');

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/leads/{$leadId}", ['stage_id' => $qualifiedStage->id])
        ->assertOk();

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('event_type', AuditAction::LeadStageChanged->value)
        ->where('target_id', $leadId)
        ->exists())->toBeTrue();
});
