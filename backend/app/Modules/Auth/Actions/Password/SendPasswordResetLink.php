<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\PasswordResetToken;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Pest\Support\Str;

class SendPasswordResetLink
{
    public function execute(string $email)
    {

    $user = User::where("email", $email)->first();
    if (!$user) {
     //   throw new \InvalidPasswordResetEmail('Invalid email address.');
    }

        PasswordResetToken::where('email', $email)->delete();
        $plainToken = Str::random(64);

        PasswordResetToken::create([
            'email' => $email,
            'token' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(30),
        ]);

        $resetUrl = url('/reset-password?email=' . urlencode($email) . '&token=' . urlencode($plainToken));
        
    
    }

}
