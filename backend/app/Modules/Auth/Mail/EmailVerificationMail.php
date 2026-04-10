<?php

namespace App\Modules\Auth\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Carbon;

class EmailVerificationMail extends Mailable
{
    public function __construct(
        public User $user,
        public string $verificationUrl,
        public Carbon $expiresAt
    ) {}

    public function build(): self
    {
        return $this->subject('Verify your email address')
            ->view('emails.auth.verify-email')
            ->with([
                'user' => $this->user,
                'verificationUrl' => $this->verificationUrl,
                'expiresAt' => $this->expiresAt,
            ]);
    }
}
