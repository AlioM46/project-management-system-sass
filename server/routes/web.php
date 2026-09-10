<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/accept-invite', function () {
    $frontendUrl = rtrim((string) (env('FRONT_END_URL') ?: env('FRONTEND_URL') ?: 'http://localhost:3000'), '/');
    $query = request()->getQueryString();
    return redirect()->to($frontendUrl . '/accept-invite' . ($query ? '?' . $query : ''));
});

Route::get('/verify-email', function () {
    $frontendUrl = rtrim((string) (env('FRONT_END_URL') ?: env('FRONTEND_URL') ?: 'http://localhost:3000'), '/');
    $query = request()->getQueryString();
    return redirect()->to($frontendUrl . '/verify-email' . ($query ? '?' . $query : ''));
});

Route::get('/reset-password', function () {
    $frontendUrl = rtrim((string) (env('FRONT_END_URL') ?: env('FRONTEND_URL') ?: 'http://localhost:3000'), '/');
    $query = request()->getQueryString();
    return redirect()->to($frontendUrl . '/reset-password' . ($query ? '?' . $query : ''));
});
