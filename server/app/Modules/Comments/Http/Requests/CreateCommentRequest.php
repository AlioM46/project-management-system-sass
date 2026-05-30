<?php

namespace App\Modules\Comments\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task_id' => ['required', 'exists:tasks,id'],
            'parent_id' => ['sometimes', 'nullable', 'exists:comments,id'],
            'content' => ['required', 'string', 'max:5000'],
            'attachments' => ['sometimes', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,docx,mp4'], // 10MB, specific file types
        ];
    }
}
