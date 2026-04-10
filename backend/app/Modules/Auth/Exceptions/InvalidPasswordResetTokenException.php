<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidPasswordResetTokenException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'The password reset token is invalid or has expired.',
            errorCode: 'IDENTITY_INVALID_PASSWORD_RESET_TOKEN',
            status: 403
        );
    }
}
