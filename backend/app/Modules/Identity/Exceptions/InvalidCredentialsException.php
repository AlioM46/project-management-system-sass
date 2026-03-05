<?php


namespace App\Modules\Identity\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidCredentialsException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'Invalid email or password.',
            code: 'IDENTITY_INVALID_CREDENTIALS',
            status: 401
        );
    }
}