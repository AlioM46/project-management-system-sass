<?php

namespace App\Modules\RolesPermissions\Http\Requests;

use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CreateWorkspaceRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->input('slug');
        $name = $this->input('name');

        if (is_string($slug) && trim($slug) !== '') {
            $this->merge(['slug' => Str::slug($slug)]);

            return;
        }

        if (is_string($name) && trim($name) !== '') {
            $this->merge(['slug' => Str::slug($name)]);
        }
    }

    public function rules(): array
    {
        $workspaceId = (int) app(WorkspaceContextService::class)->currentWorkspaceId();
        $catalog = app(PermissionCatalogService::class);

        return [
            'name' => [
                'required',
                'string',
                'max:150',
                function (string $attribute, mixed $value, \Closure $fail) use ($catalog): void {
                    if ($catalog->isReservedRoleName((string) $value)) {
                        $fail('The selected role name is reserved.');
                    }
                },
                Rule::unique('roles', 'name')->where('workspace_id', $workspaceId),
            ],
            'slug' => [
                'required',
                'string',
                'max:150',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($catalog): void {
                    if ($catalog->isReservedRoleSlug((string) $value)) {
                        $fail('The selected role slug is reserved.');
                    }
                },
                Rule::unique('roles', 'slug')->where('workspace_id', $workspaceId),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
