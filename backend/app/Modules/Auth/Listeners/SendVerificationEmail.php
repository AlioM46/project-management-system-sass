<?php

namespace App\Modules\Auth\Listeners;

use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Services\EmailVerficationService;

class SendVerificationEmail
{
    public function __construct(
        private readonly EmailVerficationService $service
    ) {}

    public function handle(UserRegistered $event): void
    {
        $this->service->send($event->user);
    }
}
