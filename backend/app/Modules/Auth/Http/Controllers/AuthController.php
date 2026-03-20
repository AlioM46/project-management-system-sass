<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
// Actions
use App\Modules\Auth\Actions\Auth\LoginUser as LoginAction;
use App\Modules\Auth\Actions\Auth\LogoutUser as LogoutAction;
use App\Modules\Auth\Actions\Auth\RegisterUser as RegisterAction;
use App\Modules\Auth\Actions\Auth\MeUser as MeAction;
// Requests
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
// Shared
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{

    public function register(RegisterRequest $request, RegisterAction $action): JsonResponse
    {
        $result = $action->execute($request->validated());

        return ApiResponse::success(
            message: 'Register successful.',
            data: $result,
            status: 201
        );
    }

    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        $result = $action->execute($request->validated());

        return ApiResponse::success(
            message: 'Login successful.',
            data: $result,
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
        );
    }
}
