<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\User;
use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Services\AuthService;
use Illuminate\Support\Facades\DB;

class RegisterUser
{
    public function execute(array $data): array
    {
        $user = null;

        $result = DB::transaction(function () use ($data, &$user) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $accessToken = AuthService::generateAccessToken($user);
            $refreshToken = AuthService::generateRefreshToken($user);
            $refreshTokenExpiration = AuthService::refreshTokenExpiresAt();

            $user->refresh_token = AuthService::hashRefreshToken($refreshToken);
            $user->refresh_token_expiration = $refreshTokenExpiration;
            $user->save();

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

        event(new UserRegistered($user));

        return $result;
    }
}
