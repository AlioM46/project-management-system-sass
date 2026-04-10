<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password', function () {
    return view('auth.temp-reset-password', [
        'email' => request('email', ''),
        'token' => request('token', ''),
    ]);
});
