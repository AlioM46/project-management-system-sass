<?php

namespace App\Modules\Auth\Actions\Password;

use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ResetPassword
{
    public function execute(array $data)
    {

        $password = $data["password"];
        $passwordConfirmation = $data["password_confirmation"];

        $email = strtolower(trim($data["email"]));
        $hashedToken = hash('sha256', $data["plain_token"]);

        $reset = PasswordResetToken::where('email', $email)
            ->where('token', $hashedToken)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$reset) {
            // throw InvalidResetLinkResponse();
            throw new \Exception('ASD1');

        }

        if ($reset->expires_at->isPast()) {
            // throw ResetLinkExpiredResponse();
            throw new \Exception('ASD Expired');
        }
        $user = User::where('email', $email)->first();


        if (!$user) {
            // throw InvalidResetLinkResponse();
            throw new \Exception('ASD');

        }


        if (Hash::check($password, $user->password)) {
            // throw NewPasswordSameAsOldResponse();
            throw new \Exception('ASD Matched Passwords');

        }

        DB::transaction(function () use ($user, $reset, $email, $password) {
            $user->password = Hash::make($password);
            $user->save();


            PasswordResetToken::where('email', $email)
                ->whereNull('used_at')
                ->update(['used_at' => now()]);

        });
    }
}
