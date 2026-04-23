<?php

use App\Modules\Tasks\Http\Controllers\TaskAssigneesController;
use App\Modules\Tasks\Http\Controllers\TasksController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/', [TasksController::class, 'create'])
            ->middleware('hasPermission:task.create');

        Route::get('/', [TasksController::class, 'index'])
            ->middleware('hasPermission:task.view');

        Route::get('/{taskId}', [TasksController::class, 'show'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.view');

        Route::match(['put', 'patch'], '/{taskId}', [TasksController::class, 'update'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.update');

        Route::delete('/{taskId}', [TasksController::class, 'delete'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.delete');

        // Route::get("/tasks/user", [TasksController::class, 'indexByUser'])
        //     ->middleware('hasPermission:task.view');
    
        // Route::get("/")
    
        // REACH HERE;;;;
    
        Route::post('/{taskId}/assignees', [TaskAssigneesController::class, 'add'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.assign');

        Route::delete('/{taskId}/assignees', [TaskAssigneesController::class, 'remove'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.assign');

        Route::put('/{taskId}/assignees', [TaskAssigneesController::class, 'replace'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.assign');

        Route::get('/{taskId}/assignees', [TaskAssigneesController::class, 'index'])
            ->whereNumber('taskId')
            ->middleware('hasPermission:task.view');
    });
