<?php

namespace App\Modules\Workspace\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeaveCurrentWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'successor_member_id' => ['nullable', 'integer', 'exists:workspace_members,id'],
        ];
    }
}
