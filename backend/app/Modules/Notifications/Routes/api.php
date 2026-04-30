<?php

use App\Modules\Notifications\Http\Controllers\NotificationController;

Route::middleware(['auth:api', 'workspace.context'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read', [NotificationController::class, 'markAllAsRead']);
});