<?php

declare(strict_types=1);

namespace Tests\Feature\Workspace;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

it('allows workspace owner to update workspace name and records audit log', function () {
    $user = User::query()->create([
        'name' => 'Workspace Owner',
        'username' => 'wsowner',
        'email' => 'wsowner@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Original Name'], $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson('/api/workspaces/current', [
            'name' => 'Renamed Workspace',
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Workspace updated successfully.')
        ->assertJsonPath('data.workspace.name', 'Renamed Workspace');

    expect($workspace->fresh()->name)->toBe('Renamed Workspace');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::WorkspaceUpdated->value)
        ->exists())->toBeTrue();
});

it('rejects invalid workspace name', function () {
    $user = User::query()->create([
        'name' => 'Workspace Owner',
        'username' => 'wsowner2',
        'email' => 'wsowner2@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Original Name'], $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson('/api/workspaces/current', [
            'name' => 'A', // too short (< 2)
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'VALIDATION_ERROR');

    expect($response->json('error.meta.errors.name'))->not->toBeEmpty();
});
