<?php

namespace App\Modules\RolesPermissions\Http\Requests;

use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateWorkspaceRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('slug') && is_string($this->input('slug'))) {
            $this->merge(['slug' => Str::slug((string) $this->input('slug'))]);
        }
    }

    public function rules(): array
    {
        $workspaceId = (int) app(WorkspaceContextService::class)->currentWorkspaceId();
        $roleId = (int) $this->route('roleId');
        $catalog = app(PermissionCatalogService::class);

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                function (string $attribute, mixed $value, \Closure $fail) use ($catalog): void {
                    if ($catalog->isReservedRoleName((string) $value)) {
                        $fail('The selected role name is reserved.');
                    }
                },
                Rule::unique('roles', 'name')
                    ->where('workspace_id', $workspaceId)
                    ->ignore($roleId),
            ],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($catalog): void {
                    if ($catalog->isReservedRoleSlug((string) $value)) {
                        $fail('The selected role slug is reserved.');
                    }
                },
                Rule::unique('roles', 'slug')
                    ->where('workspace_id', $workspaceId)
                    ->ignore($roleId),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
