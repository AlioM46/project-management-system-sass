<?php

namespace App\Modules\Auth\Events;

use App\Models\User;

class UserRegistered
{
    public function __construct(
        public readonly User $user
    ) {}
}
