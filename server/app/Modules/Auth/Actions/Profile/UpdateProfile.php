<?php

namespace App\Modules\Auth\Actions\Profile;

use App\Models\User;

class UpdateProfile
{
    public function execute(User $user, array $data): User
    {
        $user->fill(array_filter($data, fn ($value) => $value !== null));
        $user->save();

        return $user->fresh();
    }
}
