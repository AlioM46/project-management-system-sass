<?php

namespace App\Modules\Auth\Actions\Password;

use App\Models\User;
use App\Modules\Auth\Events\PasswordChanged;
use App\Modules\Auth\Exceptions\InvalidCurrentPasswordException;
use App\Modules\Auth\Exceptions\PasswordReuseException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

class ChangePassword
{
    public function execute(?User $user, array $data): void
    {
        $currentPassword = $data['current_password'];
        $newPassword = $data['new_password'];

        if (!$user) {
            throw new AuthenticationException();
        }

        if (!Hash::check($currentPassword, $user->password)) {
            throw new InvalidCurrentPasswordException();
        }

        if (Hash::check($newPassword, $user->password)) {
            throw new PasswordReuseException();
        }

        $user->password = $newPassword;
        $user->save();

        event(new PasswordChanged($user->fresh()));
    }
}
