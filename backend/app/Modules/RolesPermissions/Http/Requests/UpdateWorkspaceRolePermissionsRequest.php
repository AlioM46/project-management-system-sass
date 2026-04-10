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
            // Array
            'permissions' => ['required', 'array'],
            // permissions.*: each item in the permissions array must be a string and distinct
            // permissions.1, permissions.2, etc. will be validated against these rules
            'permissions.*' => ['required', 'string', 'distinct'],
        ];
    }
}
