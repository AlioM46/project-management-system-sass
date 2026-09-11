<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Billing\Services\StripeService;
use App\Modules\Workspace\Model\Workspace;

/**
 * Resumes a subscription that was scheduled for cancellation before its period ends.
 */
class ResumeSubscriptionAction
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
    public function execute(Workspace $workspace): array
    {
        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($subscription && $subscription->stripe_subscription_id) {
            $this->stripeService->resumeSubscription(
                (string) $subscription->stripe_subscription_id
            );

            $subscription->update([
                'canceled_at' => null,
                'status' => Subscription::STATUS_ACTIVE,
            ]);
        }

        return $this->getSummaryAction->execute($workspace);
    }
}
