<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Auth\Http\Controllers\EmailVerficationController;
use App\Modules\Auth\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    Route::get('/email/verify/{id}/{hash}', [EmailVerficationController::class, 'verify'])
        ->middleware('throttle:6,1');

    Route::prefix("password")->group(function () {
          Route::post('/send-reset-link', [PasswordResetController::class, 'SendPasswordResetLink'])
            ->middleware('throttle:6,1')
            ->name('password.password-reset-link');

            Route::post('/reset-password', [PasswordResetController::class, 'ResetPassword'])
            ->middleware('throttle:6,1')
            ->name('password.password-reset');
    });

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/email/send-verification', [EmailVerficationController::class, 'send'])
            ->middleware('throttle:6,1')
            ->name('verification.send');
    });
});
