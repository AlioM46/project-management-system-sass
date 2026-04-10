<?php

namespace App\Modules\Auth\Actions\Password;

use App\Models\PasswordResetToken;
use App\Models\User;
use App\Modules\Auth\Exceptions\InvalidPasswordResetEmail;
use App\Modules\Auth\Mail\ResetPasswordLink;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendPasswordResetLink
{
    public function execute(string $email)
    {

        $user = User::where("email", $email)->first();
        if (!$user) {
            throw new InvalidPasswordResetEmail();
        }

        PasswordResetToken::where('email', $email)->delete();
        $plainToken = Str::random(64);

        PasswordResetToken::create([
            'email' => $email,
            'token' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(30),
        ]);

        $resetUrl = url('/reset-password?email=' . urlencode($email) . '&token=' . urlencode($plainToken));

        // TEMP: disabled while testing the local reset page.
        // Revert by uncommenting the line below and removing the temporary controller response.
        Mail::to($email)->send(new ResetPasswordLink($user, $resetUrl));

        return $resetUrl;

    }

}
