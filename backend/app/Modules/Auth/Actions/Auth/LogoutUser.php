<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class LogoutUser
{
    public function execute(?User $user, ?string $token = null): void
    {
        if ($user) {
            DB::transaction(function () use ($user) {
                $user->forceFill([
                    'refresh_token' => null,
                    'refresh_token_expiration' => null,
                ])->save();
            });
        }

        if ($token) {
            JWTAuth::setToken($token)->invalidate(true);
        }
    }
}
