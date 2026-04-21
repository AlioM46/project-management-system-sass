<?php

namespace App\Modules\Tasks\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if (!$this->has('project_id') && $this->has('projectId')) {
            $payload['project_id'] = $this->input('projectId');
        }

        if (!$this->has('assignee_ids') && $this->has('assigneeIds')) {
            $payload['assignee_ids'] = $this->input('assigneeIds');
        }

        if ($this->has('title') && is_string($this->input('title'))) {
            $payload['title'] = trim((string) $this->input('title'));
        }

        if ($this->has('description') && is_string($this->input('description'))) {
            $description = trim((string) $this->input('description'));
            $payload['description'] = $description === '' ? null : $description;
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'assignee_ids' => ['sometimes', 'array'],
            'assignee_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
