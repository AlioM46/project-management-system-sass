<?php

namespace App\Modules\Tasks\Http\Requests;

use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('title') && is_string($this->input('title'))) {
            $payload['title'] = trim((string) $this->input('title'));
        }

        if ($this->has('description') && is_string($this->input('description'))) {
            $description = trim((string) $this->input('description'));
            $payload['description'] = $description === '' ? null : $description;
        }

        if ($this->has('status')) {
            
        $this->merge([
            'status' => TaskStatus::from($this->input('status'))
                ]);
         }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'required', new Enum(TaskStatus::class)], 
       ];
    }
}
