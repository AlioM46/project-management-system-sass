<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidPasswordResetEmail extends BusinessException
{
    public function __construct(string $message = 'The password reset email is invalid or has expired.')
    {
        parent::__construct(
            message: $message,
            errorCode: 'IDENTITY_INVALID_PASSWORD_RESET_EMAIL',
            status: 400
        );
    }
}
