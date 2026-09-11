<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Handles incoming events sent by Stripe webhooks.
 *
 * Automatically provisions, renews, updates, or cancels workspace subscriptions.
 */
class HandleStripeWebhook
{
    /**
     * Process an incoming Stripe event payload.
     *
     * @param array<string, mixed> $event
     * @return array{handled: bool, event_type: string, message: string}
     */
    public function execute(array $event): array
    {
        $eventType = (string) ($event['type'] ?? '');
        $dataObject = $event['data']['object'] ?? [];

        Log::info("Billing: Processing Stripe webhook event [{$eventType}]", [
            'id' => $event['id'] ?? null,
        ]);

        return match ($eventType) {
            'checkout.session.completed' => $this->handleCheckoutSessionCompleted($dataObject),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($dataObject),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($dataObject),
            'invoice.payment_failed' => $this->handleInvoicePaymentFailed($dataObject),
            default => [
                'handled' => false,
                'event_type' => $eventType,
                'message' => "Event '{$eventType}' ignored (no handler required).",
            ],
        };
    }

    /**
     * Handle completed checkout session (Initial subscription or upgrade).
     *
     * @param array<string, mixed> $session
     * @return array{handled: bool, event_type: string, message: string}
     */
    private function handleCheckoutSessionCompleted(array $session): array
    {
        $workspaceId = (int) ($session['client_reference_id'] ?? $session['metadata']['workspace_id'] ?? 0);
        $planSlug = (string) ($session['metadata']['plan_slug'] ?? '');
        $billingInterval = (string) ($session['metadata']['billing_interval'] ?? Subscription::INTERVAL_MONTHLY);

        $customerId = isset($session['customer']) ? (string) $session['customer'] : null;
        $subscriptionId = isset($session['subscription']) ? (string) $session['subscription'] : null;

        if ($workspaceId === 0) {
            Log::warning('Billing Webhook: checkout.session.completed missing workspace_id.', ['session' => $session]);

            return [
                'handled' => false,
                'event_type' => 'checkout.session.completed',
                'message' => 'Missing workspace_id in checkout session metadata.',
            ];
        }

        /** @var Plan|null $plan */
        $plan = Plan::query()->where('slug', $planSlug)->first();

        if (!$plan) {
            // Fallback: look up by plan_id if provided
            $planId = (int) ($session['metadata']['plan_id'] ?? 0);
            $plan = Plan::query()->find($planId);
        }

        if (!$plan) {
            Log::error("Billing Webhook: Plan '{$planSlug}' not found for workspace {$workspaceId}.");

            return [
                'handled' => false,
                'event_type' => 'checkout.session.completed',
                'message' => "Plan '{$planSlug}' not found.",
            ];
        }

        $periodEnd = $billingInterval === Subscription::INTERVAL_YEARLY
            ? now()->addYear()
            : now()->addMonth();

        Subscription::query()->updateOrCreate(
            ['workspace_id' => $workspaceId],
            [
                'plan_id' => $plan->id,
                'status' => Subscription::STATUS_ACTIVE,
                'billing_interval' => $billingInterval,
                'stripe_customer_id' => $customerId,
                'stripe_subscription_id' => $subscriptionId,
                'current_period_end' => $periodEnd,
                'canceled_at' => null,
            ]
        );

        Log::info("Billing Webhook: Provisioned {$plan->name} plan for workspace #{$workspaceId}.");

        return [
            'handled' => true,
            'event_type' => 'checkout.session.completed',
            'message' => "Successfully provisioned {$plan->name} for workspace {$workspaceId}.",
        ];
    }

    /**
     * Handle subscription updates (renewal, interval change, cancellation scheduled).
     *
     * @param array<string, mixed> $stripeSub
     * @return array{handled: bool, event_type: string, message: string}
     */
    private function handleSubscriptionUpdated(array $stripeSub): array
    {
        $subscriptionId = (string) ($stripeSub['id'] ?? '');

        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('stripe_subscription_id', $subscriptionId)
            ->first();

        if (!$subscription) {
            return [
                'handled' => false,
                'event_type' => 'customer.subscription.updated',
                'message' => "No local subscription found for Stripe ID '{$subscriptionId}'.",
            ];
        }

        $status = (string) ($stripeSub['status'] ?? Subscription::STATUS_ACTIVE);
        $periodEndTimestamp = $stripeSub['current_period_end'] ?? null;
        $canceledAtTimestamp = $stripeSub['canceled_at'] ?? null;

        $updates = [
            'status' => $status,
        ];

        if ($periodEndTimestamp) {
            $updates['current_period_end'] = Carbon::createFromTimestamp((int) $periodEndTimestamp);
        }

        if ($canceledAtTimestamp) {
            $updates['canceled_at'] = Carbon::createFromTimestamp((int) $canceledAtTimestamp);
        }

        $subscription->update($updates);

        return [
            'handled' => true,
            'event_type' => 'customer.subscription.updated',
            'message' => "Updated subscription status to '{$status}' for workspace {$subscription->workspace_id}.",
        ];
    }

    /**
     * Handle subscription deletion (end of canceled billing period or immediate cancellation).
     *
     * Downgrades workspace back to the Free plan.
     *
     * @param array<string, mixed> $stripeSub
     * @return array{handled: bool, event_type: string, message: string}
     */
    private function handleSubscriptionDeleted(array $stripeSub): array
    {
        $subscriptionId = (string) ($stripeSub['id'] ?? '');

        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('stripe_subscription_id', $subscriptionId)
            ->first();

        if (!$subscription) {
            return [
                'handled' => false,
                'event_type' => 'customer.subscription.deleted',
                'message' => "No local subscription found for Stripe ID '{$subscriptionId}'.",
            ];
        }

        $freePlanId = Plan::query()->where('slug', Plan::SLUG_FREE)->value('id');

        $subscription->update([
            'plan_id' => $freePlanId,
            'status' => Subscription::STATUS_CANCELED,
            'stripe_subscription_id' => null,
            'canceled_at' => now(),
        ]);

        Log::info("Billing Webhook: Downgraded workspace #{$subscription->workspace_id} to Free plan after subscription deletion.");

        return [
            'handled' => true,
            'event_type' => 'customer.subscription.deleted',
            'message' => "Downgraded workspace {$subscription->workspace_id} to Free plan.",
        ];
    }

    /**
     * Handle invoice payment failure (e.g. expired card, insufficient funds).
     *
     * Marks the workspace status as past_due.
     *
     * @param array<string, mixed> $invoice
     * @return array{handled: bool, event_type: string, message: string}
     */
    private function handleInvoicePaymentFailed(array $invoice): array
    {
        $subscriptionId = isset($invoice['subscription']) ? (string) $invoice['subscription'] : null;
        $customerId = isset($invoice['customer']) ? (string) $invoice['customer'] : null;

        $query = Subscription::query();

        if ($subscriptionId) {
            $query->where('stripe_subscription_id', $subscriptionId);
        } elseif ($customerId) {
            $query->where('stripe_customer_id', $customerId);
        } else {
            return [
                'handled' => false,
                'event_type' => 'invoice.payment_failed',
                'message' => 'Invoice payload missing subscription and customer ID.',
            ];
        }

        /** @var Subscription|null $subscription */
        $subscription = $query->first();

        if ($subscription) {
            $subscription->update([
                'status' => Subscription::STATUS_PAST_DUE,
            ]);

            Log::warning("Billing Webhook: Marked workspace #{$subscription->workspace_id} as past_due due to failed payment.");

            return [
                'handled' => true,
                'event_type' => 'invoice.payment_failed',
                'message' => "Marked workspace {$subscription->workspace_id} as past_due.",
            ];
        }

        return [
            'handled' => false,
            'event_type' => 'invoice.payment_failed',
            'message' => 'No matching subscription found to mark past_due.',
        ];
    }
}
