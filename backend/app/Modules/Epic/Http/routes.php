<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->prefix('epic')->group(function () {
    // Base module routes will be added here.
});
