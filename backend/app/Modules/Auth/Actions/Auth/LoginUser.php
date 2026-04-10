<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\User;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LoginUser
{
    public function execute(array $data)
    {
        $user = User::query()->where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new InvalidCredentialsException();
        }

        return DB::transaction(function () use ($user) {
            $accessToken = AuthService::generateAccessToken($user);
            $refreshToken = AuthService::generateRefreshToken($user);
            $refreshTokenExpiration = AuthService::refreshTokenExpiresAt();

            $user->forceFill([
                'last_login_at' => now(),
                'last_login_ip' => request()->ip(),
                'refresh_token' => AuthService::hashRefreshToken($refreshToken),
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
                'refresh_token_cookie' => $refreshToken,
            ];
        });
    }
}
