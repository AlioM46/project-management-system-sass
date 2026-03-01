<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        // Only format JSON API responses (api/* or expectsJson)
        if ($request->expectsJson() || $request->is('api/*')) {

            // 422 Validation
            if ($e instanceof ValidationException) {
                return response()->json([
                    'isSuccess' => false,
                    'data' => null,
                    'message' => 'Validation error',
                    'errors' => $e->errors(),
                ], 422);
            }

            // 401 Unauthenticated
            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'isSuccess' => false,
                    'data' => null,
                    'message' => 'Unauthenticated',
                    'errors' => null,
                ], 401);
            }

            // HTTP exceptions (403/404/etc)
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();

                $defaultMessage = match ($status) {
                    403 => 'Forbidden',
                    404 => 'Not Found',
                    405 => 'Method Not Allowed',
                    429 => 'Too Many Requests',
                    default => 'Request failed',
                };

                return response()->json([
                    'isSuccess' => false,
                    'data' => null,
                    'message' => $e->getMessage() ?: $defaultMessage,
                    'errors' => null,
                ], $status);
            }

            // 500 Unknown / server errors
            // In production: hide real exception details
            $isDebug = config('app.debug');

            return response()->json([
                'isSuccess' => false,
                'data' => null,
                'message' => $isDebug ? $e->getMessage() : 'Server error',
                'errors' => $isDebug ? [
                    'exception' => class_basename($e),
                    // You can remove trace for security if you want
                    // 'trace' => collect($e->getTrace())->take(5),
                ] : null,
            ], 500);
        }

        // Non-API requests -> default Laravel behavior
        return parent::render($request, $e);
    }
}
