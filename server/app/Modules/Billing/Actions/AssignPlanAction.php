<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Billing\Services\PlanLimitService;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AssignPlanAction
{
    public function __construct(
        private readonly PlanLimitService $planLimitService
    ) {
    }

    /**
     * Assign or change a workspace plan directly.
     *
     * @return array{
     *     plan: Plan,
     *     subscription: Subscription,
     *     usage: array<string, mixed>
     * }
     */
    public function execute(
        Workspace $workspace,
        string $planSlug,
        string $billingInterval = Subscription::INTERVAL_MONTHLY,
        string $status = Subscription::STATUS_ACTIVE
    ): array {
        /** @var Plan|null $plan */
        $plan = Plan::query()->where('slug', $planSlug)->first();

        if (!$plan) {
            throw new ModelNotFoundException("Plan with slug '{$planSlug}' not found.");
        }

        $periodEnd = $billingInterval === Subscription::INTERVAL_YEARLY
            ? now()->addYear()
            : now()->addMonth();

        /** @var Subscription $subscription */
        $subscription = Subscription::query()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'plan_id' => $plan->id,
                'status' => $status,
                'billing_interval' => $billingInterval,
                'current_period_end' => $plan->isFree() ? null : $periodEnd,
                'canceled_at' => null,
            ]
        );

        $subscription->setRelation('plan', $plan);
        $workspace->setRelation('subscription', $subscription);

        $usage = $this->planLimitService->getUsageSummary($workspace);

        return [
            'plan' => $plan,
            'subscription' => $subscription,
            'usage' => $usage,
        ];
    }
}
