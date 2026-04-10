<?php

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\BusinessException;

class InvalidEmailVerificationLinkException extends BusinessException
{
    public function __construct()
    {
        parent::__construct(
            message: 'The verification link is invalid or has expired.',
            errorCode: 'IDENTITY_INVALID_EMAIL_VERIFICATION_LINK',
            status: 403
        );
    }
}
