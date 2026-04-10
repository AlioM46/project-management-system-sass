<?php

namespace App\Modules\Auth\Actions\Password;

use App\Models\PasswordResetToken;
use App\Models\User;
use App\Modules\Auth\Events\PasswordChanged;
use App\Modules\Auth\Exceptions\InvalidPasswordResetTokenException;
use App\Modules\Auth\Exceptions\PasswordReuseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ResetPassword
{
    public function execute(array $data)
    {
        $password = $data["password"];
        $email = strtolower(trim($data["email"]));
        $hashedToken = hash('sha256', $data["plain_token"]);

        $reset = PasswordResetToken::where('email', $email)
            ->where('token', $hashedToken)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$reset) {
            throw new InvalidPasswordResetTokenException();
        }

        if ($reset->expires_at->isPast()) {
            throw new InvalidPasswordResetTokenException();
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new InvalidPasswordResetTokenException();
        }

        if (Hash::check($password, $user->password)) {
            throw new PasswordReuseException();
        }

        DB::transaction(function () use ($user, $reset, $email, $password) {
            $user->password = Hash::make($password);
            $user->save();

            PasswordResetToken::where('email', $email)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);
        });

        event(new PasswordChanged($user->fresh()));
    }
}
