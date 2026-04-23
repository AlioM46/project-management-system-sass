<?php

use App\Modules\Comments\Http\Controllers\CommentsController;
use Illuminate\Support\Facades\Route;



Route::prefix('comments')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {

        Route::post('/', [CommentsController::class, 'store'])
            ->middleware('hasPermission:comment.create');

        Route::get('/{taskId}', [CommentsController::class, 'index'])
            ->middleware('hasPermission:comment.view');


        // update: only author can delete their comment & owners+admins can delete any comment
        // problem: author may not have comment.delete permission but should be able to delete their own comment
        // solved by: using policies
        Route::delete('/{commentId}', [CommentsController::class, 'destroy'])
            ->whereNumber('commentId')
            ->middleware('hasPermission:comment.delete');


    });