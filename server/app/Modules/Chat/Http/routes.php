<?php

use App\Modules\Chat\Http\Controllers\BlockController;
use App\Modules\Chat\Http\Controllers\ConversationController;
use App\Modules\Chat\Http\Controllers\ParticipantsController;
use Illuminate\Support\Facades\Route;

Route::prefix('conversations')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{id}/messages', [ConversationController::class, 'getMessages'])->whereNumber('id');
        Route::post('/{id}/messages', [ConversationController::class, 'sendMessage'])->whereNumber('id');
        Route::post('/presence/deliver-all', [ConversationController::class, 'markAllDeliveredOnPresenceJoin']);

        Route::post('/{id}/messages/{messageId}/deliver', [ConversationController::class, 'markAsDelivered'])->whereNumber('id')->whereNumber('messageId');
        Route::post('/{id}/read', [ConversationController::class, 'markAsRead'])->whereNumber('id');
        Route::delete('/{id}/messages/{messageId}/deleteForMe', [ConversationController::class, 'deleteForMe'])->whereNumber('id')->whereNumber('messageId');

        Route::delete('/{id}/messages/{messageId}/delete', [ConversationController::class, 'deleteForAll'])->whereNumber('id')->whereNumber('messageId');

        Route::put('/{id}/messages/{messageId}/updateForMe', [ConversationController::class, 'update'])->whereNumber('id')->whereNumber('messageId');

        Route::post('/{id}/messages/{messageId}/reactions', [ConversationController::class, 'toggleReaction'])->whereNumber('id')->whereNumber('messageId');
        Route::post('/{id}/messages/{messageId}/star', [ConversationController::class, 'toggleStarMessage'])->whereNumber('id')->whereNumber('messageId');
        Route::post('/{id}/messages/{messageId}/pin', [ConversationController::class, 'togglePinMessage'])->whereNumber('id')->whereNumber('messageId');

        Route::get('/{id}/messages/search', [ConversationController::class, 'searchMessages'])->whereNumber('id');
        Route::get('/{id}/starred', [ConversationController::class, 'getStarredMessages'])->whereNumber('id');
        Route::get('/{id}/pinned-message', [ConversationController::class, 'getPinnedMessage'])->whereNumber('id');

        Route::get('/{id}/info', [ConversationController::class, 'sidebarInfo'])->whereNumber('id');
        Route::put('/{id}', [ConversationController::class, 'updateDetails'])->whereNumber('id');

        // Conversation Actions Routes
        Route::post('/{id}/pin', [ConversationController::class, 'togglePinConversation'])->whereNumber('id');
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
