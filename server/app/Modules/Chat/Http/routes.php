<?php

use App\Modules\Chat\Http\Controllers\ConversationController;
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
    });
