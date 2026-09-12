<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeTrashTestUser(string $email): User
{
    return User::query()->create([
        'name' => 'Trash Test User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function makeTrashTestProject(int $workspaceId, int $userId, string $name = 'Test Project'): Project
{
    return Project::query()->withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspaceId,
        'name' => $name,
        'description' => 'Test project description',
        'created_by_user_id' => $userId,
    ]);
}

function makeTrashTestTask(int $workspaceId, int $projectId, int $userId, string $title = 'Test Task'): Task
{
    return Task::query()->withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspaceId,
        'project_id' => $projectId,
        'title' => $title,
        'status' => 'todo',
        'created_by_user_id' => $userId,
    ]);
}

it('lists trashed tasks and projects in active workspace', function () {
    $user = makeTrashTestUser('trash-list@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Trash WS'], $user);

    $project = makeTrashTestProject($workspace->id, $user->id, 'Deleted Project');
    $project->delete();

    $task = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Deleted Task');
    $task->delete();

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/trash');

    $response->assertOk()
        ->assertJsonPath('data.total', 2);

    $items = $response->json('data.items');
    expect($items)->toHaveCount(2);
});

it('restores a trashed task', function () {
    $user = makeTrashTestUser('trash-restore-task@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Trash WS'], $user);
    $project = makeTrashTestProject($workspace->id, $user->id);

    $task = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Restore Me');
    $task->delete();

    expect(Task::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(0);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson("/api/trash/task/{$task->id}/restore");

    $response->assertOk()
        ->assertJsonPath('data.restored', true);

    expect(Task::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('restores a project and cascades restoration to associated tasks', function () {
    $user = makeTrashTestUser('trash-restore-project@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Trash WS'], $user);

    $project = makeTrashTestProject($workspace->id, $user->id, 'Cascade Project');
    $task = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Cascade Task');

    $task->delete();
    $project->delete();

    expect(Project::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(0);
    expect(Task::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(0);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson("/api/trash/project/{$project->id}/restore");

    $response->assertOk()
        ->assertJsonPath('data.restored', true)
        ->assertJsonPath('data.restored_tasks_count', 1);

    expect(Project::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(1);
    expect(Task::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('permanently deletes an item with force delete', function () {
    $user = makeTrashTestUser('trash-force@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Trash WS'], $user);
    $project = makeTrashTestProject($workspace->id, $user->id);

    $task = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Purge Me');
    $task->delete();

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->deleteJson("/api/trash/task/{$task->id}/force");

    $response->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(Task::withTrashed()->withoutGlobalScope(WorkspaceTenantScope::class)->where('id', $task->id)->count())->toBe(0);
});

it('purges soft-deleted records via retention purge console command', function () {
    $user = makeTrashTestUser('trash-console@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Purge WS'], $user);
    $project = makeTrashTestProject($workspace->id, $user->id);

    // Record 1: Deleted 35 days ago (should be purged)
    $oldTask = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Old Deleted Task');
    $oldTask->delete();
    $oldTask->deleted_at = now()->subDays(35);
    $oldTask->saveQuietly();

    // Record 2: Deleted 5 days ago (should NOT be purged)
    $recentTask = makeTrashTestTask($workspace->id, $project->id, $user->id, 'Recent Deleted Task');
    $recentTask->delete();
    $recentTask->deleted_at = now()->subDays(5);
    $recentTask->saveQuietly();

    $this->artisan('workspace:purge-deleted', ['--days' => 30])
        ->assertSuccessful();

    // Old task is gone permanently
    expect(Task::withTrashed()->withoutGlobalScope(WorkspaceTenantScope::class)->where('id', $oldTask->id)->exists())->toBeFalse();
    // Recent task is preserved in trash
    expect(Task::onlyTrashed()->withoutGlobalScope(WorkspaceTenantScope::class)->where('id', $recentTask->id)->exists())->toBeTrue();
});

