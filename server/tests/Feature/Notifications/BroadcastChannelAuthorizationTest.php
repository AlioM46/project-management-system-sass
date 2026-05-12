<?php

use App\Models\User;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeBroadcastUser(string $email, string $name = 'Broadcast User'): User
{
    return User::query()->create([
        'email' => $email,
        'name' => $name,
        'username' => strtolower(str_replace([' ', '@', '.'], '', $email)),
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createBroadcastWorkspace(User $user, string $name = 'Broadcast Workspace'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

function notificationChannelCallback(): callable
{
    return Broadcast::getChannels()->get('workspaces.{workspaceId}.users.{userId}');
}

it('authorizes private notification channel access for the matching workspace user', function () {
    $user = makeBroadcastUser('broadcast-owner@example.com');
    $workspace = createBroadcastWorkspace($user);
    $callback = notificationChannelCallback();

    expect($callback($user, $workspace->id, $user->id))->toBeTrue();
});

it('denies private notification channel access when the user id does not match the channel', function () {
    $user = makeBroadcastUser('broadcast-owner@example.com');
    $workspace = createBroadcastWorkspace($user);
    $otherUser = makeBroadcastUser('broadcast-other@example.com', 'Other User');
    $callback = notificationChannelCallback();

    expect($callback($user, $workspace->id, $otherUser->id))->toBeFalse();
});

it('denies private notification channel access when the user is not a member of the workspace', function () {
    $owner = makeBroadcastUser('broadcast-owner@example.com');
    $outsider = makeBroadcastUser('broadcast-outsider@example.com', 'Outside User');
    $workspace = createBroadcastWorkspace($owner);
    $callback = notificationChannelCallback();

    expect($callback($outsider, $workspace->id, $outsider->id))->toBeFalse();
});
