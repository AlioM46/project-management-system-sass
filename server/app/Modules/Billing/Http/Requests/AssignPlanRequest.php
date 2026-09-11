<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Requests;

use App\Modules\Billing\Model\Subscription;
use Illuminate\Foundation\Http\FormRequest;

class AssignPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
            'billing_interval' => ['nullable', 'string', 'in:' . Subscription::INTERVAL_MONTHLY . ',' . Subscription::INTERVAL_YEARLY],
            'status' => ['nullable', 'string', 'in:' . implode(',', [
                Subscription::STATUS_ACTIVE,
                Subscription::STATUS_PAST_DUE,
                Subscription::STATUS_CANCELED,
                Subscription::STATUS_TRIALING,
            ])],
        ];
    }
}
