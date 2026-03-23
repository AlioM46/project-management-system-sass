<?php

namespace App\Modules\Auth\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\Auth\SendPasswordResetLink;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{


    public function SendPasswordResetLink(Request $request , SendPasswordResetLink $action )
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $action->execute($request->only('email'));

        return response()->json([
            'message' => 'If your email is registered, you will receive a password reset link shortly.',
        ], 200);
    }


}
