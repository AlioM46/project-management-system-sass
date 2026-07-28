<?php

namespace App\Modules\Leads\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListLeadsRequest extends FormRequest
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
            'assigneeId' => 'assignee_id',
            'perPage' => 'per_page',
            'sortBy' => 'sort_by',
            'sortDir' => 'sort_dir',
        ];

        foreach ($aliases as $from => $to) {
            if (! $this->has($to) && $this->has($from)) {
                $payload[$to] = $this->input($from);
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'course_id' => ['sometimes', 'integer', 'exists:courses,id'],
            'stage_id' => ['sometimes', 'integer', 'exists:stages,id'],
            'assignee_id' => ['sometimes', 'integer', 'exists:users,id'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['sometimes', Rule::in(['created_at', 'updated_at', 'title'])],
            'sort_dir' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }
}
