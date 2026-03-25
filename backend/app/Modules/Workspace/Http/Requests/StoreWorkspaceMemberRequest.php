<?php

namespace App\Modules\Workspace\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role_id' => ['nullable', 'integer', 'min:1'],
            'joined_at' => ['nullable', 'date'],
        ];
    }
}
