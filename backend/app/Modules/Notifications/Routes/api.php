<?php

use App\Modules\Notifications\Http\Controllers\NotificationsController;

Route::middleware(['auth:api', 'workspace.context'])->group(function () {
    Route::get('/notifications', [NotificationsController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationsController::class, 'markAsRead']);
    Route::post('/notifications/read', [NotificationsController::class, 'markAllAsRead']);
});
