<?php

declare(strict_types=1);

namespace App\Modules\Auth\Listeners;

use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Mail\WelcomeRegisteredMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        try {
            Mail::to($event->user->email)->send(new WelcomeRegisteredMail($event->user));
        } catch (\Throwable $e) {
            Log::error("Failed to send welcome email to {$event->user->email}: {$e->getMessage()}");
        }
    }
}
