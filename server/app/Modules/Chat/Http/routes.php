<?php

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
        Route::delete('/{id}/messages/{messageId}/deleteForMe', [ConversationController::class, 'deleteForMe'])->whereNumber('id')->whereNumber('messageId');

        Route::delete('/{id}/messages/{messageId}/delete', [ConversationController::class, 'deleteForAll'])->whereNumber('id')->whereNumber('messageId');

        Route::put('/{id}/messages/{messageId}/updateForMe', [ConversationController::class, 'update'])->whereNumber('id')->whereNumber('messageId');

        Route::post('/{id}/messages/{messageId}/reactions', [ConversationController::class, 'toggleReaction'])->whereNumber('id')->whereNumber('messageId');

        Route::get('/{id}/messages/search', [ConversationController::class, 'searchMessages'])->whereNumber('id');

        Route::get('/{id}/info', [ConversationController::class, 'sidebarInfo'])->whereNumber('id');
        Route::put('/{id}', [ConversationController::class, 'updateDetails'])->whereNumber('id');

        // Participant Management Routes
        Route::post('/{id}/participants', [ParticipantsController::class, 'AddParticipants'])->whereNumber('id');
        Route::delete('/{id}/participants/{userId}', [ParticipantsController::class, 'RemoveParticipants'])->whereNumber('id')->whereNumber('userId');
        Route::put('/{id}/participants/{participantId}/role', [ParticipantsController::class, 'ChangeParticipantRole'])->whereNumber('id')->whereNumber('participantId');
    });
