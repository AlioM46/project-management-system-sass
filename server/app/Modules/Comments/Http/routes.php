<?php

use App\Modules\Comments\Http\Controllers\CommentsController;
use Illuminate\Support\Facades\Route;

Route::prefix('comments')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {

        Route::post('/', [CommentsController::class, 'store'])
            ->middleware('hasPermission:comment.create');

        // List comments for a task with pagination
        Route::get('/task/{taskId}', [CommentsController::class, 'index'])
            ->middleware('hasPermission:comment.view')
            ->name('comments.task');

        // Get single comment
        Route::get('/{commentId}', [CommentsController::class, 'show'])
            ->whereNumber('commentId')
            ->middleware('hasPermission:comment.view');

        // Update comment (author or admin/owner)
        Route::put('/{commentId}', [CommentsController::class, 'update'])
            ->whereNumber('commentId');

        // Delete comment (author or admin/owner)
        Route::delete('/{commentId}', [CommentsController::class, 'destroy'])
            ->whereNumber('commentId');

        // Attachment routes
        Route::delete('/attachments/{attachmentId}', [CommentsController::class, 'destroyAttachment'])
            ->whereNumber('attachmentId')
            ->middleware('hasPermission:comment.delete');

    });
