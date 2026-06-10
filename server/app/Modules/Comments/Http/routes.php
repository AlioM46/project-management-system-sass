<?php

use App\Modules\Comments\Http\Controllers\CommentsController;
use Illuminate\Support\Facades\Route;

Route::prefix('comments')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/', [CommentsController::class, 'store'])
            ->middleware('hasPermission:comment.create');

        Route::get('/lead/{leadId}', [CommentsController::class, 'index'])
            ->middleware('hasPermission:comment.view')
            ->name('comments.lead');

        Route::get('/{commentId}', [CommentsController::class, 'show'])
            ->whereNumber('commentId')
            ->middleware('hasPermission:comment.view');

        Route::put('/{commentId}', [CommentsController::class, 'update'])
            ->whereNumber('commentId');

        Route::delete('/{commentId}', [CommentsController::class, 'destroy'])
            ->whereNumber('commentId');

        Route::delete('/attachments/{attachmentId}', [CommentsController::class, 'destroyAttachment'])
            ->whereNumber('attachmentId')
            ->middleware('hasPermission:comment.delete');
    });
