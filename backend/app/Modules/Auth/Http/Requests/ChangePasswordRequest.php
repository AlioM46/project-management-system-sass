<?php

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;



class ChangePasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            "current_password" => ['required', 'string'],
            'new_password' => ['required', "string", Password::min(8)],
            'new_password_confirmation' => ['required', "string", 'same:new_password'],
        ];
    }
}
