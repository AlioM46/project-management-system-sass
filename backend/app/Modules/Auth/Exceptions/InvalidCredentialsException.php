<?php


namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidCredentialsException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'Invalid email or password.',
            errorCode: 'IDENTITY_INVALID_CREDENTIALS',
            status: 401
        );
    }
}
