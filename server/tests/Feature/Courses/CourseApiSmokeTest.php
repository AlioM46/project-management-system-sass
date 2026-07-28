<?php

use App\Models\User;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeCourseApiUser(string $email): User
{
    return User::query()->create([
        'name' => 'Course API User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('creates and lists courses with renamed response keys', function () {
    $user = makeCourseApiUser('course-api@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Course API WS'], $user);

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/courses', [
            'name' => 'Manual Transmission Basics',
            'description' => 'Introductory academy course',
            'price' => 250,
            'duration_hours' => 8,
        ])
        ->assertCreated()
        ->assertJsonPath('data.course.name', 'Manual Transmission Basics')
        ->assertJsonPath('data.course.price', '250.00')
        ->assertJsonPath('data.course.duration_hours', 8);

    $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/courses')
        ->assertOk()
        ->assertJsonPath('data.count', 1)
        ->assertJsonPath('data.courses.0.name', 'Manual Transmission Basics');
});
