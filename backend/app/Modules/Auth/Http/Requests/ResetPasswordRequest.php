<?php

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;


class ResetPasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'plain_token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255', 'exists:users,email'],
            'password' => ['required', Password::min(8)],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }
}
