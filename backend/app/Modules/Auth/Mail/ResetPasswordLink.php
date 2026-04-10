<?php

namespace App\Modules\Auth\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;

class ResetPasswordLink extends Mailable
{
    public function __construct(
        public User $user,
        public string $resetUrl,
    ) {}

    public function build(): self
    {
        return $this->subject('Reset your password')
            ->view('emails.auth.reset-password')
            ->with([
                'user' => $this->user,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}
