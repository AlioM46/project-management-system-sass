<?php

namespace App\Exceptions;

use App\Shared\Exceptions\BusinessException;
use App\Shared\Http\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    protected function shouldReturnJson($request, Throwable $e): bool
    {
        return $request->expectsJson() || $request->is('api/*');
    }

  public function register(): void
{
    $this->renderable(function (Throwable $e, $request) {
        if ($e instanceof BusinessException) {
            return ApiResponse::error(
                code: $e->errorCode,
                message: $e->getMessage(),
                meta: $e->meta,
                status: $e->status
            );
        }

        if ($e instanceof ValidationException) {
            return ApiResponse::error(
                code: 'VALIDATION_ERROR',
                message: 'Validation error',
                meta: ['errors' => $e->errors()],
                status: 422
            );
        }

        if ($e instanceof AuthenticationException) {
            return ApiResponse::error(
                code: 'UNAUTHENTICATED11',
                message: 'Unauthenticated',
                status: 401
            );
        }

        $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
        $message = $e->getMessage();

        if ($message === '') {
            $message = $status >= 500 ? 'Server error' : 'Request failed';
        } elseif ($status >= 500 && ! config('app.debug')) {
            $message = 'Server error';
        }

        $meta = [];
        if (config('app.debug') && $status >= 500) {
            $meta = ['exception' => class_basename($e)];
        }

        return ApiResponse::error(
            code: 'UNEXPECTED_ERROR',
            message: $message,
            meta: $meta,
            status: $status
        );
    });
}
};
