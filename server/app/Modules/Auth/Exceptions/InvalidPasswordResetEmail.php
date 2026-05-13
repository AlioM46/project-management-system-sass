<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidPasswordResetEmail extends BusinessException
{
    public function __construct(string $message = 'the email is invalid for reset password')
    {
        parent::__construct(
            message: $message,
            errorCode: 'IDENTITY_INVALID_PASSWORD_RESET_EMAIL',
            status: 400
        );
    }
}
