<?php

namespace App\Shared\Broadcasting;

use Illuminate\Broadcasting\PrivateChannel;

final class RealtimeChannel
{
    public static function workspaceUser(int $workspaceId, int $userId): string
    {
        return "workspaces.{$workspaceId}.users.{$userId}";
    }

    public static function privateWorkspaceUser(int $workspaceId, int $userId): PrivateChannel
    {
        return new PrivateChannel(self::workspaceUser($workspaceId, $userId));
    }
}
