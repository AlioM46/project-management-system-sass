<?php

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('workspaces.{workspaceId}.users.{userId}', function (User $user, int $workspaceId, int $userId) {
    if ($user->id !== $userId) {
        return false;
    }

    $workspace = Workspace::query()->find($workspaceId);

    if (!$workspace) {
        return false;
    }

    return $workspace->containsUser($user->id);
}, ['guards' => ['api']]);
