<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
// Actions
use App\Modules\Auth\Actions\Auth\LoginUser as LoginAction;
use App\Modules\Auth\Actions\Auth\LogoutUser as LogoutAction;
use App\Modules\Auth\Actions\Auth\MeUser as MeAction;
use App\Modules\Auth\Actions\Auth\RefreshTokenUser as RefreshTokenAction;
use App\Modules\Auth\Actions\Auth\RegisterUser as RegisterAction;
use App\Modules\Auth\Http\Requests\LoginRequest;
// Requests
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Services\AuthService;
// Shared
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterAction $action): JsonResponse
    {
        $result = $action->execute($request->validated());

        return $this->respondWithRefreshTokenCookie(
            message: 'Register successful. Please verify your email address.',
            result: $result,
            status: 201
        );
    }

    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        $result = $action->execute($request->validated());

        return $this->respondWithRefreshTokenCookie(
            message: 'Login successful.',
            result: $result,
            status: 200
        );

    }

    public function refreshToken(Request $request, RefreshTokenAction $action): JsonResponse
    {
        $result = $action->execute($request->cookie(AuthService::REFRESH_TOKEN_COOKIE));

        return $this->respondWithRefreshTokenCookie(
            message: 'Token refreshed successfully.',
            result: $result,
            status: 200
        );
    }

    public function me(Request $request, MeAction $action): JsonResponse
    {
        $user = $action->execute($request->user());

        return ApiResponse::success(
            message: 'Authenticated user retrieved successfully.',
            data: $user,
            status: 200
        );
    }

    public function logout(Request $request, LogoutAction $action): JsonResponse
    {
        $action->execute($request->user(), $request->bearerToken());

        return ApiResponse::success(
            message: 'Logout successful.',
            status: 200
        )->withCookie(AuthService::forgetRefreshTokenCookie());
    }

    private function respondWithRefreshTokenCookie(string $message, array $result, int $status): JsonResponse
    {
        return ApiResponse::success(
            message: $message,
            data: $result['data'],
            status: $status
        )->withCookie(AuthService::makeRefreshTokenCookie($result['refresh_token_cookie']));
    }
}
