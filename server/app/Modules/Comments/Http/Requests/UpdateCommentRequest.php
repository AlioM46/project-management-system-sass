<?php

namespace App\Modules\Comments\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:5000'],
            'attachments' => ['sometimes', 'array'],
            'attachments.*' => ['nullable'], // Validated manually in the service as either ID or File
        ];
    }
}
