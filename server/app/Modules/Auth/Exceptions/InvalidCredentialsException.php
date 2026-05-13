<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidCredentialsException extends BusinessException
{
    public function __construct($message = 'Invalid email or password.')
    {
        parent::__construct(
            message: $message,
            errorCode: 'IDENTITY_INVALID_CREDENTIALS',
            status: 401
        );
    }
}
