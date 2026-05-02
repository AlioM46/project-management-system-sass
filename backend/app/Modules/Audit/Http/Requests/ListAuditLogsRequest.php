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

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    public function rules(): array
    {
        return [
            'event_type' => ['sometimes', Rule::in(AuditAction::values())],
            'target_type' => ['sometimes', Rule::in(AuditTargetType::values())],
            'target_id' => ['sometimes', 'integer', 'min:1'],
            'actor_user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
