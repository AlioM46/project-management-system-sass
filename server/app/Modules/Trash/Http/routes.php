<?php

declare(strict_types=1);

use App\Modules\Trash\Http\Controllers\TrashController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'workspace.context'])->prefix('trash')->group(function () {
    Route::get('/', [TrashController::class, 'index']);
    Route::delete('/empty', [TrashController::class, 'empty']);
    Route::post('/{type}/{id}/restore', [TrashController::class, 'restore']);
    Route::delete('/{type}/{id}/force', [TrashController::class, 'forceDelete']);
});

