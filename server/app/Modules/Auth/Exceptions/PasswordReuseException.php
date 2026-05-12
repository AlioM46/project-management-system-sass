<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class PasswordReuseException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'The new password must be different from your current password.',
            errorCode: 'IDENTITY_PASSWORD_REUSE',
            status: 422
        );
    }
}
