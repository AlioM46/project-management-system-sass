<?php

namespace App\Modules\Auth\Listeners;

use App\Modules\Auth\Events\PasswordChanged;
use App\Modules\Auth\Mail\PasswordChangedMail;
use Illuminate\Support\Facades\Mail;

class SendPasswordChangedEmail
{
    public function handle(PasswordChanged $event): void
    {
        Mail::to($event->user->email)->send(new PasswordChangedMail($event->user));
    }
}
