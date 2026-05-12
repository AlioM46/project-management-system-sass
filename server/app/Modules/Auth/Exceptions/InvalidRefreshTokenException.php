<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidRefreshTokenException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'Invalid or expired refresh token.',
            errorCode: 'IDENTITY_INVALID_REFRESH_TOKEN',
            status: 401
        );
    }
}
