<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\Password\ResetPassword;
use App\Modules\Auth\Actions\Password\SendPasswordResetLink as SendPasswordResetLinkAction;
use App\Modules\Auth\Http\Requests\ResetPasswordRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{

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

        return ApiResponse::success('If your email is registered, you will receive a password reset link shortly.', ["reset_link_sent" => $result]);
    }
}
