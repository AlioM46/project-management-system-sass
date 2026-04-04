<?php

namespace App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests;

use Illuminate\Foundation\Http\FormRequest;

class InviteWorkspaceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
