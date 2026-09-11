<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Billing\Services\StripeService;
use App\Modules\Workspace\Model\Workspace;

/**
 * Handles workspace subscription cancellation.
 *
 * Sets cancel_at_period_end=true in Stripe so team maintains paid benefits
 * until the end of their billing cycle without renewing.
 */
class CancelSubscriptionAction
{
    public function __construct(
        private readonly StripeService $stripeService,
        private readonly GetSubscriptionSummaryAction $getSummaryAction
    ) {
    }

    /**
     * @return array{
     *     plan: Plan,
     *     subscription: ?Subscription,
     *     is_paid_plan: bool,
     *     usage: array<string, mixed>
     * }
     */
    public function execute(Workspace $workspace, bool $immediately = false): array
    {
        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($subscription && $subscription->stripe_subscription_id) {
            $this->stripeService->cancelSubscription(
                (string) $subscription->stripe_subscription_id,
                atPeriodEnd: !$immediately
            );

            if ($immediately) {
                $freePlan = Plan::query()->where('slug', Plan::SLUG_FREE)->firstOrFail();
                $subscription->update([
                    'plan_id' => $freePlan->id,
                    'status' => Subscription::STATUS_CANCELED,
                    'canceled_at' => now(),
                    'current_period_end' => null,
                ]);
            } else {
                $subscription->update([
                    'canceled_at' => now(),
                ]);
            }
        } elseif ($subscription) {
            $freePlan = Plan::query()->where('slug', Plan::SLUG_FREE)->firstOrFail();
            $subscription->update([
                'plan_id' => $freePlan->id,
                'status' => Subscription::STATUS_CANCELED,
                'canceled_at' => now(),
                'current_period_end' => null,
            ]);
        }

        return $this->getSummaryAction->execute($workspace);
    }
}
