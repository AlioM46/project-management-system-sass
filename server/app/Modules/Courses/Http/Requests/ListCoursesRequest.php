<?php

namespace App\Modules\Courses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListCoursesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('search') && is_string($this->input('search'))) {
            $search = trim((string) $this->input('search'));

            $this->merge([
                'search' => $search === '' ? null : $search,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'include_deleted' => ['sometimes', 'boolean'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
