<?php

namespace App\Http\Middleware;

use App\Shared\Http\ApiResponse;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;

class Authenticate extends Middleware
{
    protected function unauthenticated($request, array $guards)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            throw new HttpResponseException(
                ApiResponse::error(
                    code: 'UNAUTHENTICATED',
                    message: 'Unauthenticated',
                    status: 401
                )
            );
        }

        parent::unauthenticated($request, $guards);
    }
}
