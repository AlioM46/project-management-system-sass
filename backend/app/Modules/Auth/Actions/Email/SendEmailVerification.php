<?php

namespace App\Modules\Auth\Actions\Email;

use App\Models\User;
use App\Modules\Auth\Services\EmailVerficationService;

class SendEmailVerification
{
    public function __construct(
        private readonly EmailVerficationService $service
    ) {}

    public function execute(User $user): array
    {
        return $this->service->send($user);
    }
}
