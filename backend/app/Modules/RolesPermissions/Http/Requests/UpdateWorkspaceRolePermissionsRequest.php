<?php

namespace App\Modules\RolesPermissions\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => ['required', 'array'],
            'permissions.*' => ['required', 'string', 'distinct'],
        ];
    }
}
