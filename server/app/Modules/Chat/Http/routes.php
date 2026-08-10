<?php

use App\Modules\Chat\Http\Controllers\BlockController;
use App\Modules\Chat\Http\Controllers\ChatMessageController;
use App\Modules\Chat\Http\Controllers\ConversationController;
use App\Modules\Chat\Http\Controllers\MessageReactionController;
use App\Modules\Chat\Http\Controllers\ParticipantsController;
use Illuminate\Support\Facades\Route;

Route::prefix('conversations')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        // Conversation Management Routes
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{id}/info', [ConversationController::class, 'sidebarInfo'])->whereNumber('id');
        Route::put('/{id}', [ConversationController::class, 'updateDetails'])->whereNumber('id');

        // Message Operations Routes
        Route::get('/{id}/messages', [ChatMessageController::class, 'getMessages'])->whereNumber('id');
        Route::post('/{id}/messages', [ChatMessageController::class, 'sendMessage'])->whereNumber('id');
        Route::get('/{id}/messages/search', [ChatMessageController::class, 'searchMessages'])->whereNumber('id');
        Route::put('/{id}/messages/{messageId}/updateForMe', [ChatMessageController::class, 'update'])->whereNumber('id')->whereNumber('messageId');
        Route::delete('/{id}/messages/{messageId}/deleteForMe', [ChatMessageController::class, 'deleteForMe'])->whereNumber('id')->whereNumber('messageId');
        Route::delete('/{id}/messages/{messageId}/delete', [ChatMessageController::class, 'deleteForAll'])->whereNumber('id')->whereNumber('messageId');

        // Message Reactions & Starred Routes
        Route::post('/{id}/messages/{messageId}/reactions', [MessageReactionController::class, 'toggleReaction'])->whereNumber('id')->whereNumber('messageId');
        Route::post('/{id}/messages/{messageId}/star', [MessageReactionController::class, 'toggleStarMessage'])->whereNumber('id')->whereNumber('messageId');
        Route::get('/{id}/starred', [MessageReactionController::class, 'getStarredMessages'])->whereNumber('id');

        // Conversation Action Routes
        Route::post('/{id}/clear', [ParticipantsController::class, 'ClearConversation'])->whereNumber('id');
        Route::delete('/{id}', [ParticipantsController::class, 'DeleteConversation'])->whereNumber('id');
        Route::post('/{id}/mute', [ParticipantsController::class, 'ToggleMute'])->whereNumber('id');

        // Participant Management Routes
        Route::post('/{id}/participants', [ParticipantsController::class, 'AddParticipants'])->whereNumber('id');
        Route::delete('/{id}/participants/{userId}', [ParticipantsController::class, 'RemoveParticipants'])->whereNumber('id')->whereNumber('userId');
        Route::put('/{id}/participants/{participantId}/role', [ParticipantsController::class, 'ChangeParticipantRole'])->whereNumber('id')->whereNumber('participantId');
    });

Route::prefix('users')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/block', [BlockController::class, 'blockUser']);
        Route::delete('/unblock/{userId}', [BlockController::class, 'unblockUser'])->whereNumber('userId');
        Route::get('/blocked', [BlockController::class, 'getBlockedUsers']);
    });
