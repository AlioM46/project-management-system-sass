<?php

use App\Modules\Projects\Http\Controllers\ProjectsController;
use Illuminate\Support\Facades\Route;

Route::prefix('projects')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/', [ProjectsController::class, 'create'])
            ->middleware('hasPermission:project.create');

        Route::get('/', [ProjectsController::class, 'index'])
            ->middleware('hasPermission:project.view');

        Route::get('/{projectId}', [ProjectsController::class, 'show'])
            ->whereNumber('projectId')
            ->middleware('hasPermission:project.view');

        Route::patch('/{projectId}', [ProjectsController::class, 'update'])
            ->whereNumber('projectId')
            ->middleware('hasPermission:project.update');

        Route::delete('/{projectId}', [ProjectsController::class, 'delete'])
            ->whereNumber('projectId')
            ->middleware('hasPermission:project.delete');

        Route::post('/{projectId}/restore', [ProjectsController::class, 'restore'])
            ->whereNumber('projectId')
            ->middleware('hasPermission:project.restore');
    });
