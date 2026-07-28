<?php

use App\Modules\Courses\Http\Controllers\CoursesController;
use Illuminate\Support\Facades\Route;

Route::prefix('courses')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/', [CoursesController::class, 'create'])
            ->middleware('hasPermission:course.create');

        Route::get('/', [CoursesController::class, 'index'])
            ->middleware('hasPermission:course.view');

        Route::get('/{courseId}', [CoursesController::class, 'show'])
            ->whereNumber('courseId')
            ->middleware('hasPermission:course.view');

        Route::patch('/{courseId}', [CoursesController::class, 'update'])
            ->whereNumber('courseId')
            ->middleware('hasPermission:course.update');

        Route::delete('/{courseId}', [CoursesController::class, 'delete'])
            ->whereNumber('courseId')
            ->middleware('hasPermission:course.delete');

        Route::post('/{courseId}/restore', [CoursesController::class, 'restore'])
            ->whereNumber('courseId')
            ->middleware('hasPermission:course.restore');
    });
