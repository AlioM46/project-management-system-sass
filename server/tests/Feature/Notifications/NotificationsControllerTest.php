<?php

use App\Models\User;
use App\Modules\Notifications\Events\NotificationRead;
use App\Modules\Notifications\Events\NotificationReadAll;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeNotificationUser(string $email, string $name = 'Notification User'): User
{
    return User::query()->create([
        'email' => $email,
        'name' => $name,
        'username' => strtolower(str_replace([' ', '@', '.'], '', $email)),
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createNotificationWorkspace(User $user, string $name = 'Notifications Workspace'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

function createWorkspaceNotification(
    Workspace $workspace,
    User $user,
    string $type = 'mentioned',
    ?string $readAt = null
): Notification {
    return Notification::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'type' => $type,
        'data' => ['message' => 'Test notification'],
        'read_at' => $readAt,
    ]);
}

it('does not mark a notification from another workspace as read', function () {
    Event::fake([NotificationRead::class]);

    $user = makeNotificationUser('notifications-owner@example.com');
    $workspaceA = createNotificationWorkspace($user, 'Workspace A');
    $workspaceB = createNotificationWorkspace($user, 'Workspace B');

    $notificationInWorkspaceB = createWorkspaceNotification($workspaceB, $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->postJson("/api/notifications/{$notificationInWorkspaceB->id}/read");

    $response->assertNotFound()
        ->assertJsonPath('error.code', 'NOT_FOUND');

    expect($notificationInWorkspaceB->fresh()->read_at)->toBeNull();

    Event::assertNotDispatched(NotificationRead::class);
});

it('marks all notifications as read only inside the active workspace', function () {
    Event::fake([NotificationReadAll::class]);

    $user = makeNotificationUser('notifications-bulk@example.com');
    $workspaceA = createNotificationWorkspace($user, 'Workspace A');
    $workspaceB = createNotificationWorkspace($user, 'Workspace B');

    $workspaceAFirst = createWorkspaceNotification($workspaceA, $user, 'mentioned');
    $workspaceASecond = createWorkspaceNotification($workspaceA, $user, 'lead_updated');
    $workspaceARead = createWorkspaceNotification($workspaceA, $user, 'lead_assigned', now()->subMinute()->toISOString());
    $workspaceBNotification = createWorkspaceNotification($workspaceB, $user, 'mentioned');

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->postJson('/api/notifications/read');

    $response->assertOk()
        ->assertJsonPath('message', 'All notifications marked as read successfully');

    expect($workspaceAFirst->fresh()->read_at)->not->toBeNull()
        ->and($workspaceASecond->fresh()->read_at)->not->toBeNull()
        ->and($workspaceARead->fresh()->read_at)->not->toBeNull()
        ->and($workspaceBNotification->fresh()->read_at)->toBeNull();

    Event::assertDispatched(NotificationReadAll::class, function (NotificationReadAll $event) use ($workspaceA, $user) {
        $payload = $event->broadcastWith();

        return $event->broadcastOn()->name === 'private-workspaces.'.$workspaceA->id.'.users.'.$user->id
            && $payload['workspace_id'] === $workspaceA->id
            && $payload['user_id'] === $user->id
            && $payload['read_at'] !== null;
    });
});

it('dispatches the scoped notification read event for the active workspace notification', function () {
    Event::fake([NotificationRead::class]);

    $user = makeNotificationUser('notifications-single@example.com');
    $workspace = createNotificationWorkspace($user);
    $notification = createWorkspaceNotification($workspace, $user);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson("/api/notifications/{$notification->id}/read");

    $response->assertOk()
        ->assertJsonPath('message', 'Notification marked as read successfully');

    Event::assertDispatched(NotificationRead::class, function (NotificationRead $event) use ($notification, $workspace, $user) {
        $payload = $event->broadcastWith();

        return $event->notification->is($notification->fresh())
            && $event->broadcastOn()->name === 'private-workspaces.'.$workspace->id.'.users.'.$user->id
            && $payload['id'] === $notification->id
            && $payload['workspace_id'] === $workspace->id
            && $payload['user_id'] === $user->id
            && $payload['read_at'] !== null;
    });
});
