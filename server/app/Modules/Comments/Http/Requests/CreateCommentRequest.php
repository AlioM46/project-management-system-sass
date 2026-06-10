<?php

namespace App\Modules\Comments\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('lead_id') && $this->has('leadId')) {
            $this->merge(['lead_id' => $this->input('leadId')]);
        }
    }

    public function rules(): array
    {
        return [
            'lead_id' => ['required', 'exists:leads,id'],
            'parent_id' => ['sometimes', 'nullable', 'exists:comments,id'],
            'content' => ['required', 'string', 'max:5000'],
            'attachments' => ['sometimes', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,pdf,docx,mp4'],
        ];
    }
}
