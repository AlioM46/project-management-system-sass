<?php

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Leads\Model\Student;
use App\Modules\Leads\Model\OutboundMessage;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeLeadAutomationUser(string $email): User
{
    return User::query()->create([
        'name' => 'Lead Automation User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('creates a student when a lead moves into a success stage', function () {
    $user = makeLeadAutomationUser('lead-automation@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Lead Automation WS'], $user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Defensive Driving',
        'description' => 'Advanced driving academy course',
        'price' => 499.99,
        'duration_hours' => 16,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'defensive driving',
    ]);

    $newStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'New Lead',
        'position' => 1,
        'is_success' => false,
    ]);

    $wonStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'Won',
        'position' => 2,
        'is_success' => true,
    ]);

    $createLeadResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $course->id,
            'stage_id' => $newStage->id,
            'title' => 'Ahmad Salem',
            'phone' => '+966500000000',
            'source' => 'website',
        ]);

    $createLeadResponse->assertCreated()
        ->assertJsonPath('data.lead.course_id', $course->id)
        ->assertJsonPath('data.lead.stage_id', $newStage->id);

    $leadId = $createLeadResponse->json('data.lead.id');

    expect(Student::query()->count())->toBe(0);

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/leads/{$leadId}", [
            'stage_id' => $wonStage->id,
        ])
        ->assertOk()
        ->assertJsonPath('data.lead.stage_id', $wonStage->id);

    $student = Student::query()->where('lead_id', $leadId)->first();

    expect($student)->not->toBeNull()
        ->and($student->workspace_id)->toBe($workspace->id)
        ->and($student->academic_status)->toBe('active')
        ->and($student->student_code)->toStartWith('HYPRO-')
        ->and(AuditLog::query()->where('event_type', AuditAction::StudentCreated->value)->where('target_id', $student->id)->exists())->toBeTrue()
        ->and(AuditLog::query()->where('event_type', AuditAction::LeadConvertedToStudent->value)->where('target_id', $leadId)->exists())->toBeTrue()
        ->and(Notification::query()->where('type', 'lead_converted')->where('workspace_id', $workspace->id)->exists())->toBeTrue();
});

it('creates an outbound whatsapp message record when a lead converts', function () {
    $user = makeLeadAutomationUser('lead-message@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Lead Messaging WS'], $user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Advanced Parking',
        'description' => 'Precision driving for urban environments',
        'price' => 399.99,
        'duration_hours' => 10,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'advanced parking',
    ]);

    $newStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'New Lead',
        'position' => 1,
        'is_success' => false,
    ]);

    $wonStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'Won',
        'position' => 2,
        'is_success' => true,
    ]);

    $leadResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $course->id,
            'stage_id' => $newStage->id,
            'title' => 'Layan Omar',
            'phone' => '+966511111111',
            'source' => 'website',
        ]);

    $leadId = $leadResponse->json('data.lead.id');

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/leads/{$leadId}", [
            'stage_id' => $wonStage->id,
        ])
        ->assertOk();

    $student = Student::query()->where('lead_id', $leadId)->firstOrFail();
    $message = OutboundMessage::query()->where('student_id', $student->id)->first();

    expect($message)->not->toBeNull()
        ->and($message->status)->toBe('sent')
        ->and($message->recipient_phone)->toBe('+966511111111')
        ->and(AuditLog::query()->where('event_type', AuditAction::WhatsAppMessageQueued->value)->where('target_id', $message->id)->exists())->toBeTrue()
        ->and(AuditLog::query()->where('event_type', AuditAction::WhatsAppMessageSent->value)->where('target_id', $message->id)->exists())->toBeTrue();
});

it('records student academic status changes in audit logs', function () {
    $user = makeLeadAutomationUser('student-status@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Student Status WS'], $user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Night Driving',
        'description' => 'Night safety and visibility program',
        'price' => 550.00,
        'duration_hours' => 14,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'night driving',
    ]);

    $newStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'New Lead',
        'position' => 1,
        'is_success' => false,
    ]);

    $wonStage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'Won',
        'position' => 2,
        'is_success' => true,
    ]);

    $leadResponse = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/leads', [
            'course_id' => $course->id,
            'stage_id' => $newStage->id,
            'title' => 'Sara Fahad',
            'phone' => '+966522222222',
        ]);

    $leadId = $leadResponse->json('data.lead.id');
    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/leads/{$leadId}", ['stage_id' => $wonStage->id])
        ->assertOk();

    $student = Student::query()->where('lead_id', $leadId)->firstOrFail();

    $student->update(['academic_status' => 'graduated']);

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('event_type', AuditAction::StudentStatusUpdated->value)
        ->where('target_id', $student->id)
        ->exists())->toBeTrue();
});
