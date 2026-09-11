<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Subscription;
use App\Modules\Billing\Services\PlanLimitService;
use App\Modules\Workspace\Model\Workspace;

class GetSubscriptionSummaryAction
{
    public function __construct(
        private readonly PlanLimitService $planLimitService
    ) {
    }

    /**
     * @return array{
     *     plan: \App\Modules\Billing\Model\Plan,
     *     subscription: ?Subscription,
     *     usage: array<string, mixed>
     * }
     */
    public function execute(Workspace $workspace): array
    {
        $plan = $this->planLimitService->getEffectivePlan($workspace);

        $subscription = Subscription::query()
            ->where('workspace_id', $workspace->id)
            ->with('plan')
            ->first();

        $usage = $this->planLimitService->getUsageSummary($workspace);

        return [
            'plan' => $plan,
            'subscription' => $subscription,
            'usage' => $usage,
        ];
    }
}
