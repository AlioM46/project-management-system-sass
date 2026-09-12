<?php

use App\Models\User;
use App\Modules\Auth\Mail\EmailVerificationMail;
use App\Modules\Auth\Services\EmailVerficationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

it('sends a custom verification mail after registration', function () {
    Mail::fake();

    $response = $this->postJson('/api/auth/register', [
        'name' => 'Ali Omar',
        'username' => 'aliomar',
        'email' => 'ali@example.com',
        'password' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('message', 'Register successful. Please verify your email address.')
        ->assertJsonPath('data.user.email', 'ali@example.com')
        ->assertJsonPath('data.user.email_verified_at', null);

    $user = User::query()->where('email', 'ali@example.com')->firstOrFail();

    Mail::assertQueued(EmailVerificationMail::class, function (EmailVerificationMail $mail) use ($user) {
        return $mail->hasTo($user->email)
            && str_contains($mail->verificationUrl, 'id='.$user->id)
            && str_contains($mail->verificationUrl, 'hash='.sha1($user->email))
            && str_contains($mail->verificationUrl, 'expires=')
            && str_contains($mail->verificationUrl, 'signature=');
    });
});

it('resends a custom verification mail to an authenticated unverified user', function () {
    Mail::fake();

    $user = User::query()->create([
        'name' => 'Ali Omar',
        'username' => 'aliomar',
        'email' => 'ali@example.com',
        'password' => 'password123',
        'email_verified_at' => null,
    ]);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->postJson('/api/auth/email/verification-notification');

    $response->assertOk()
        ->assertJsonPath('message', 'Verification email sent successfully.')
        ->assertJsonPath('data.user.email', 'ali@example.com')
        ->assertJsonPath('data.user.email_verified_at', null);

    Mail::assertQueued(EmailVerificationMail::class, function (EmailVerificationMail $mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

it('verifies an email address through the manual signed link', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'username' => 'aliomar',
        'email' => 'ali@example.com',
        'password' => 'password123',
        'email_verified_at' => null,
    ]);

    $url = app(EmailVerficationService::class)->generateVerificationUrl($user);
    $query = parse_url($url, PHP_URL_QUERY);
    $hash = sha1($user->email);

    $response = $this->getJson("/api/auth/email/verify/{$user->id}/{$hash}?{$query}");

    $response->assertOk()
        ->assertJsonPath('message', 'Email verified successfully.')
        ->assertJsonPath('data.user.email', 'ali@example.com');

    expect($user->fresh()->email_verified_at)->not->toBeNull();
});

it('rejects a tampered manual verification signature', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'username' => 'aliomar',
        'email' => 'ali@example.com',
        'password' => 'password123',
        'email_verified_at' => null,
    ]);

    $url = app(EmailVerficationService::class)->generateVerificationUrl($user);
    $hash = sha1($user->email);

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
    $query['signature'] = 'tampered-signature';

    $response = $this->getJson(
        "/api/auth/email/verify/{$user->id}/{$hash}?".http_build_query($query, '', '&', PHP_QUERY_RFC3986)
    );

    $response->assertForbidden()
        ->assertJsonPath('error.code', 'IDENTITY_INVALID_EMAIL_VERIFICATION_LINK')
        ->assertJsonPath('error.message', 'The verification link is invalid or has expired.');

    expect($user->fresh()->email_verified_at)->toBeNull();
});
