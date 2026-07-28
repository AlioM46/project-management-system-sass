<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Model\Lead;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeCommentAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Comment Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records comment created audit log through the API', function () {
    $user = makeCommentAuditUser('comment-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Comment WS'], $user);

    $course = Course::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Comment Course',
        'description' => null,
        'price' => 700,
        'duration_hours' => 10,
        'created_by_user_id' => $user->id,
        'active_name_key' => 'comment course',
    ]);

    $stage = Stage::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'name' => 'New Inquiry',
        'position' => 1,
        'is_success' => false,
    ]);

    $lead = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'course_id' => $course->id,
        'stage_id' => $stage->id,
        'title' => 'Comment Lead',
        'description' => null,
        'phone' => '+966500000222',
        'source' => 'website',
        'created_by_user_id' => $user->id,
    ]);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/comments', [
            'lead_id' => $lead->id,
            'content' => 'Hello audit',
        ]);

    $response->assertCreated();
    $commentId = $response->json('data.comment.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::CommentCreated->value)
        ->where('target_id', $commentId)
        ->exists())->toBeTrue();
});
