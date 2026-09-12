<?php

declare(strict_types=1);

namespace App\Modules\Auth\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeRegisteredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user
    ) {}

    public function build(): self
    {
        $appUrl = config('app.frontend_url', config('app.url', 'http://localhost:3000'));

        return $this->subject('Welcome to ' . config('app.name', 'Taskflow'))
            ->view('emails.auth.welcome')
            ->with([
                'user' => $this->user,
                'dashboardUrl' => rtrim((string) $appUrl, '/') . '/dashboard',
            ]);
    }
}

