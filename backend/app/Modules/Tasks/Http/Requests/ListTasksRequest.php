<?php

namespace App\Modules\Tasks\Http\Requests;

use App\Modules\Tasks\Model\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        $aliases = [
            'projectId' => 'project_id',
            'assigneeId' => 'assignee_id',
            'perPage' => 'per_page',
            'sortBy' => 'sort_by',
            'sortDir' => 'sort_dir',
        ];

        foreach ($aliases as $from => $to) {
            if (!$this->has($to) && $this->has($from)) {
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
            'project_id' => ['sometimes', 'integer', 'exists:projects,id'],
            'status' => ['sometimes', Rule::in(Task::STATUSES)],
            'assignee_id' => ['sometimes', 'integer', 'exists:users,id'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['sometimes', Rule::in(['created_at', 'updated_at', 'title', 'status'])],
            'sort_dir' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }
}
