<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidCurrentPasswordException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'The current password is incorrect.',
            errorCode: 'IDENTITY_INVALID_CURRENT_PASSWORD',
            status: 422
        );
    }
}
