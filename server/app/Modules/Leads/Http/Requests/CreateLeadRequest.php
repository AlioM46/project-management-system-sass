<?php

namespace App\Modules\Leads\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];
        $aliases = [
            'courseId' => 'course_id',
            'project_id' => 'course_id',
            'projectId' => 'course_id',
            'stageId' => 'stage_id',
            'assigneeIds' => 'assignee_ids',
            'lostReason' => 'lost_reason',
        ];

        foreach ($aliases as $from => $to) {
            if (! $this->has($to) && $this->has($from)) {
                $payload[$to] = $this->input($from);
            }
        }

        foreach (['title', 'description', 'phone', 'source', 'lost_reason'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $payload[$field] = trim((string) $this->input($field));
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'stage_id' => ['sometimes', 'integer', 'exists:stages,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'source' => ['sometimes', 'string', 'max:100'],
            'lost_reason' => ['nullable', 'string', 'max:5000'],
            'assignee_ids' => ['sometimes', 'array'],
            'assignee_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
