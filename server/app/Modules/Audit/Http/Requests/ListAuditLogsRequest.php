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
            'perPage' => 'per_page',
        ];

        $payload = [];

        foreach ($aliases as $from => $to) {
            if (!$this->has($to) && $this->has($from)) {
                $payload[$to] = $this->input($from);
            }
        }

        if ($this->has('target_type') || isset($payload['target_type'])) {
            $val = $payload['target_type'] ?? $this->input('target_type');
            if (is_string($val) && $val !== '') {
                // Convert camelCase or StudlyCase to snake_case (e.g. AuditLog -> audit_log, Task -> task)
                $payload['target_type'] = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $val));
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'event_type' => ['sometimes', 'nullable', Rule::in(AuditAction::values())],
            'target_type' => ['sometimes', 'nullable', Rule::in(AuditTargetType::values())],
            'target_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'actor_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'from' => ['sometimes', 'nullable', 'date'],
            'to' => ['sometimes', 'nullable', 'date', 'after_or_equal:from'],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
