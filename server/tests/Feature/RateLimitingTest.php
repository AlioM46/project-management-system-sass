<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear('login:127.0.0.1|test@example.com');
    RateLimiter::clear('register:127.0.0.1');
});

test('login endpoint enforces strict rate limiting of 5 attempts per minute', function () {
    $payload = [
        'email' => 'test@example.com',
        'password' => 'wrongpassword123',
    ];

    // First 5 attempts should return 401 or 422 (not 429)
    for ($i = 0; $i < 5; $i++) {
        $response = $this->postJson('/api/auth/login', $payload);
        expect($response->status())->not->toBe(429);
    }

    // 6th attempt must be throttled (HTTP 429 Too Many Requests)
    $throttledResponse = $this->postJson('/api/auth/login', $payload);
    $throttledResponse->assertStatus(429);
    $throttledResponse->assertJson([
        'success' => false,
        'error' => [
            'code' => 'TOO_MANY_ATTEMPTS',
        ],
    ]);

    // Retrying with a DIFFERENT email from the same IP should NOT be blocked by auth.login
    $differentEmailResponse = $this->postJson('/api/auth/login', [
        'login' => 'different@example.com',
        'password' => 'wrongpassword123',
    ]);
    expect($differentEmailResponse->status())->not->toBe(429);
});

test('register endpoint enforces strict rate limiting of 5 attempts per minute', function () {
    $payload = [
        'email' => 'test_user@example.com',
        'name' => 'Test User',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ];

    for ($i = 0; $i < 5; $i++) {
        $response = $this->postJson('/api/auth/register', $payload);
        expect($response->status())->not->toBe(429);
    }

    $throttledResponse = $this->postJson('/api/auth/register', $payload);
    $throttledResponse->assertStatus(429);
    $throttledResponse->assertJson([
        'success' => false,
        'error' => [
            'code' => 'TOO_MANY_ATTEMPTS',
        ],
    ]);
});

test('password reset link endpoint enforces strict rate limiting of 3 attempts per minute', function () {
    RateLimiter::clear('pwd:127.0.0.1|reset@example.com');

    $payload = ['email' => 'reset@example.com'];

    for ($i = 0; $i < 3; $i++) {
        $response = $this->postJson('/api/auth/password/send-reset-link', $payload);
        expect($response->status())->not->toBe(429);
    }

    $throttledResponse = $this->postJson('/api/auth/password/send-reset-link', $payload);
    $throttledResponse->assertStatus(429);
    $throttledResponse->assertJson([
        'success' => false,
        'error' => [
            'code' => 'TOO_MANY_ATTEMPTS',
        ],
    ]);
});

