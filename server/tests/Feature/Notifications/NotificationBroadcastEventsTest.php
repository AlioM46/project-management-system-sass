<?php

use App\Models\User;
use App\Modules\Notifications\Events\NotificationCreated;
use App\Modules\Notifications\Events\NotificationRead;
use App\Modules\Notifications\Events\NotificationReadAll;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeNotificationEventUser(string $email, string $name = 'Event User'): User
{
    return User::query()->create([
        'email' => $email,
        'name' => $name,
        'username' => strtolower(str_replace([' ', '@', '.'], '', $email)),
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createNotificationEventWorkspace(User $user, string $name = 'Event Workspace'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

function createNotificationEventModel(Workspace $workspace, User $user): Notification
{
    return Notification::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'type' => 'mentioned',
        'data' => ['message' => 'Payload'],
        'read_at' => now(),
    ]);
}

it('broadcasts notification created on the shared private workspace user channel with the standardized payload', function () {
    $user = makeNotificationEventUser('event-created@example.com');
    $workspace = createNotificationEventWorkspace($user);
    $notification = createNotificationEventModel($workspace, $user);

    $event = new NotificationCreated($notification);

    expect($event->broadcastOn()->name)->toBe('private-workspaces.' . $workspace->id . '.users.' . $user->id)
        ->and($event->broadcastAs())->toBe('notification.created')
        ->and($event->broadcastWith())->toMatchArray([
                'id' => $notification->id,
                'type' => $notification->type,
                'data' => $notification->data,
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
            ])
        ->and($event->broadcastWith()['read_at'])->toBe($notification->read_at?->toISOString())
        ->and($event->broadcastWith()['created_at'])->toBe($notification->created_at?->toISOString());
});

it('broadcasts notification read on the shared private workspace user channel with the standardized payload', function () {
    $user = makeNotificationEventUser('event-read@example.com');
    $workspace = createNotificationEventWorkspace($user);
    $notification = createNotificationEventModel($workspace, $user);

    $event = new NotificationRead($notification);

    expect($event->broadcastOn()->name)->toBe('private-workspaces.' . $workspace->id . '.users.' . $user->id)
        ->and($event->broadcastAs())->toBe('notification.read')
        ->and($event->broadcastWith())->toMatchArray([
                'id' => $notification->id,
                'type' => $notification->type,
                'data' => $notification->data,
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
            ]);
});

it('broadcasts notification read all on the shared private workspace user channel with the standardized payload', function () {
    $user = makeNotificationEventUser('event-read-all@example.com');
    $workspace = createNotificationEventWorkspace($user);
    $readAt = now();

    $event = new NotificationReadAll($user->id, $workspace->id, $readAt);

    expect($event->broadcastOn()->name)->toBe('private-workspaces.' . $workspace->id . '.users.' . $user->id)
        ->and($event->broadcastAs())->toBe('notification.read.all')
        ->and($event->broadcastWith())->toBe([
                'id' => null,
                'type' => null,
                'data' => [],
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'read_at' => $readAt->toISOString(),
                'created_at' => null,
            ]);
});
