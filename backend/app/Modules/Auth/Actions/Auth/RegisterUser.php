<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Modules\Auth\Services\AuthService;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterUser
{
    public function execute(array $data)
    {
                $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
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
    }
}
