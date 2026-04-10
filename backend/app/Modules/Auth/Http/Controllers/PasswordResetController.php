<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\Password\ChangePassword as ChangePasswordAction;
use App\Modules\Auth\Actions\Password\ResetPassword;
use App\Modules\Auth\Actions\Password\SendPasswordResetLink as SendPasswordResetLinkAction;
use App\Modules\Auth\Http\Requests\ChangePasswordRequest;
use App\Modules\Auth\Http\Requests\ResetPasswordRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{
    public function ChangePassword(ChangePasswordRequest $request, ChangePasswordAction $action)
    {
        $action->execute($request->user(), $request->validated());

        return ApiResponse::success('Password changed successfully.');
    }

    public function ResetPassword(ResetPasswordRequest $request, ResetPassword $action)
    {
        $action->execute($request->validated());

        return ApiResponse::success("Password reset successful. You can now log in with your new password.");
    }
    public function SendPasswordResetLink(Request $request, SendPasswordResetLinkAction $action)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $result = $action->execute($request->input('email'));

        // Original response after enabling email delivery again:
        // return ApiResponse::success('If your email is registered, you will receive a password reset link shortly.');
        return ApiResponse::success(
            'Temporary local testing response. Open reset_link_sent in the browser.',
            ['reset_link_sent' => $result]
        );
    }
}
