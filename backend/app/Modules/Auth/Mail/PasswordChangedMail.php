<?php

namespace App\Modules\Auth\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;

class PasswordChangedMail extends Mailable
{
    public function __construct(
        public User $user
    ) {}

    public function build(): self
    {
        return $this->subject('Your password was changed')
            ->view('emails.auth.password-changed')
            ->with([
                'user' => $this->user,
            ]);
    }
}
