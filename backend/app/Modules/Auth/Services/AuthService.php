<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie as HttpCookie;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public const REFRESH_TOKEN_COOKIE = 'refresh_token';

    private const REFRESH_TOKEN_TTL_DAYS = 30;

    public static function generateAccessToken(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    public static function generateRefreshToken(User $user): string
    {
        return $user->getKey().'|'.Str::random(80);
    }

    public static function hashRefreshToken(string $refreshToken): string
    {
        return hash('sha256', $refreshToken);
    }

    public static function refreshTokenExpiresAt()
    {
        return now()->addDays(self::refreshTokenLifetimeDays());
    }

    public static function makeRefreshTokenCookie(string $refreshToken): HttpCookie
    {
        return Cookie::make(
            self::REFRESH_TOKEN_COOKIE,
            $refreshToken,
            self::refreshTokenLifetimeDays() * 24 * 60,
            '/',
            config('session.domain'),
            (bool) config('session.secure', false),
            true,
            false,
            config('session.same_site', 'lax')
        );
    }

    public static function forgetRefreshTokenCookie(): HttpCookie
    {
        return Cookie::forget(
            self::REFRESH_TOKEN_COOKIE,
            '/',
            config('session.domain')
        );
    }

    private static function refreshTokenLifetimeDays(): int
    {
        return self::REFRESH_TOKEN_TTL_DAYS;
    }
}
