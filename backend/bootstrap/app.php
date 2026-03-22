<?php

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\ForceJsonResponse;
use App\Shared\Exceptions\BusinessException;
use App\Shared\Http\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->appendToGroup('api', ForceJsonResponse::class);
        $middleware->alias([
            'auth' => Authenticate::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, \Throwable $e) {
            return $request->expectsJson() || $request->is('api/*');
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($e instanceof HttpResponseException) {
                return $e->getResponse();
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error(
                    code: 'UNAUTHENTICATED',
                    message: 'Unauthenticated',
                    status: 401
                );
            }

            if (! ($request->expectsJson() || $request->is('api/*'))) {
                return null;
            }

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
    })->create();
