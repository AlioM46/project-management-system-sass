<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeCourseAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Course Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records course created audit log through the API', function () {
    $user = makeCourseAuditUser('course-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Course WS'], $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/courses', [
            'name' => 'Audit Course',
            'description' => 'For audit test',
            'price' => 950,
            'duration_hours' => 18,
        ]);

    $response->assertCreated();

    $courseId = $response->json('data.course.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::CourseCreated->value)
        ->where('target_id', $courseId)
        ->exists())->toBeTrue();
});
