<?php

namespace App\Modules\Audit\Http\Requests;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListAuditLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $aliases = [
            'action' => 'event_type',
            'eventType' => 'event_type',
            'targetType' => 'target_type',
            'targetId' => 'target_id',
            'actorUserId' => 'actor_user_id',
            'assigneeUserId' => 'assignee_user_id',
            'leadId' => 'lead_id',
            'courseId' => 'course_id',
            'perPage' => 'per_page',
        ];

        $payload = [];

        foreach ($aliases as $from => $to) {
            if (!$this->has($to) && $this->has($from)) {
                $payload[$to] = $this->input($from);
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
        /*


    $payload = [
        'event_type' => 'task.deleted',
        'per_page' => 50,
    ];

    $this->merge($payload);

    Before: ( The request (it self) information )

    [
        'eventType' => 'task.deleted',
        'perPage' => 50,
    ]

After: ( the request (it self) information )

[
    'eventType' => 'task.deleted',
    'perPage' => 50,

    'event_type' => 'task.deleted',
    'per_page' => 50,
]
         */
    }

    public function rules(): array
    {
        return [
            'event_type' => ['sometimes', Rule::in(AuditAction::values())],
            'target_type' => ['sometimes', Rule::in(AuditTargetType::values())],
            'target_id' => ['sometimes', 'integer', 'min:1', 'required_with:target_type'],
            'actor_user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'assignee_user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'lead_id' => ['sometimes', 'integer', 'min:1'],
            'course_id' => ['sometimes', 'integer', 'min:1'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
