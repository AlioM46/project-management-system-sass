<?php

namespace App\Modules\Auth\Actions\Auth;

use App\Models\User;

class MeUser
{
    public function execute(User $user): array
    {
        return [
            'user' => $user->fresh(),
        ];
    }
}
