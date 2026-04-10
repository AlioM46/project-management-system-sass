<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\User;
use App\Modules\Auth\Exceptions\InvalidRefreshTokenException;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Support\Facades\DB;

class RefreshTokenUser
{
    public function execute(?string $refreshToken): array
    {
        if (!$refreshToken) {
            throw new InvalidRefreshTokenException();
        }

        $user = User::query()
            ->where('refresh_token', AuthService::hashRefreshToken($refreshToken))
            ->where('refresh_token_expiration', '>', now())
            ->first();

        if (!$user) {
            throw new InvalidRefreshTokenException();
        }

        return DB::transaction(function () use ($user) {
            $accessToken = AuthService::generateAccessToken($user);
            $newRefreshToken = AuthService::generateRefreshToken($user);
            $refreshTokenExpiration = AuthService::refreshTokenExpiresAt();

            $user->forceFill([
                'refresh_token' => AuthService::hashRefreshToken($newRefreshToken),
                'refresh_token_expiration' => $refreshTokenExpiration,
            ])->save();

            $user->refresh();

            return [
               'data' => [
                    'user' => $user,
                    'access_token' => $accessToken,
                    'token_type' => 'Bearer',
                    'expires_in' => config('jwt.ttl', 60) * 60,
                    'refresh_token_expires_at' => $refreshTokenExpiration->toISOString(),
                ],
                'refresh_token_cookie' => $newRefreshToken,
            ];
        });
    }
}
