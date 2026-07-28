<?php

namespace App\Modules\Courses\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShowCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'include_deleted' => ['sometimes', 'boolean'],
        ];
    }
}
