<?php

use App\Models\User;
use App\Modules\Chat\Model\Conversation;
use App\Modules\Chat\Model\ConversationParticipant;
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


Broadcast::channel('workspaces.{workspaceId}.conversations.{conversationId}', function (User $user, int $workspaceId, int $conversationId) {

    // 1. Verify user belongs to the workspace
    $workspace = Workspace::query()->find($workspaceId);
    if (!$workspace || !$workspace->containsUser($user->id)) {
        return false;
    }

    // 2. Verify that the conversation belongs to the workspace
    $conversation = Conversation::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspaceId)
        ->find($conversationId);
    if (!$conversation) {
        return false;
    }
    // If it's a project channel, user can view it if they belong to the workspace
    if ($conversation->type === 'project') {
        return true;
    }


    // However, when a user connects to a WebSocket channel, Laravel's 
    // broadcast authorization runs outside of the normal HTTP request lifecycle,
    //  meaning no active workspace context is set yet in your WorkspaceContextService.


    // if its Group or DM 
    // Otherwise, check if user is a participant of this conversation
    return ConversationParticipant::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspaceId)
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->where('is_active', true)
        ->exists();
}, ['guards' => ['api']]);


// Precense Channel
Broadcast::channel('workspaces.{workspaceId}', function (User $user, int $workspaceId) {
    $workspace = Workspace::query()->find($workspaceId);

    if (!$workspace || !$workspace->containsUser($user->id)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username ?? $user->name,
        'avatar_url' => $user->avatar_url,
    ];
}, ['guards' => ['api']]);
