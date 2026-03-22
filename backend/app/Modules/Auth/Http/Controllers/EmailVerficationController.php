<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\Email\SendEmailVerification as SendEmailVerificationAction;
use App\Modules\Auth\Actions\Email\VerifyEmail as VerifyEmailAction;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerficationController extends Controller
{
    public function send(Request $request, SendEmailVerificationAction $action): JsonResponse
    {
        $result = $action->execute($request->user());

        return ApiResponse::success(
            message: $result['sent']
                ? 'Verification email sent successfully.'
                : 'Email is already verified.',
            data: ['user' => $result['user']],
            status: 200
        );
    }

    public function verify(Request $request, int|string $id, string $hash, VerifyEmailAction $action): JsonResponse
    {
        $result = $action->execute($request, $id, $hash);

        return ApiResponse::success(
            message: $result['verified']
                ? 'Email verified successfully.'
                : 'Email is already verified.',
            data: ['user' => $result['user']],
            status: 200
        );
    }
}
