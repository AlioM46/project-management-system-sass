<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Resources;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    /**
     * @param array{
     *     plan: Plan,
     *     subscription: ?Subscription,
     *     usage: array<string, mixed>
     * } $resource
     */
    public function __construct(array $resource)
    {
        parent::__construct($resource);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Plan $plan */
        $plan = $this->resource['plan'];
        /** @var Subscription|null $subscription */
        $subscription = $this->resource['subscription'];
        /** @var array<string, mixed> $usage */
        $usage = $this->resource['usage'];

        return [
            'plan' => (new PlanResource($plan))->toArray($request),
            'subscription' => $subscription ? [
                'id' => (int) $subscription->id,
                'status' => (string) $subscription->status,
                'billing_interval' => (string) $subscription->billing_interval,
                'current_period_end' => $subscription->current_period_end?->toIso8601String(),
                'canceled_at' => $subscription->canceled_at?->toIso8601String(),
                'is_active' => $subscription->isActive(),
                'is_canceled' => $subscription->isCanceled(),
            ] : null,
            'is_paid_plan' => !$plan->isFree(),
            'usage' => $usage,
        ];
    }
}
