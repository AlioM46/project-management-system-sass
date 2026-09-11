<?php

declare(strict_types=1);

namespace App\Modules\Billing\Services;

use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Native Stripe REST API Client (No external libraries required).
 *
 * Communicates directly with Stripe API v1 using Laravel's native HTTP client.
 */
class StripeService
{
    private const BASE_URL = 'https://api.stripe.com/v1';

    public function __construct(
        private readonly ?string $secretKey = null,
        private readonly ?string $webhookSecret = null
    ) {
    }

    /**
     * Build an authenticated HTTP client configured for Stripe API.
     */
    private function client(): PendingRequest
    {
        $key = $this->secretKey ?? (string) config('services.stripe.secret');

        if ($key === '') {
            throw new RuntimeException('Stripe secret key is not configured in services.stripe.secret.');
        }

        return Http::withToken($key)
            ->baseUrl(self::BASE_URL)
            ->asForm(); // Stripe REST API expects application/x-www-form-urlencoded
    }

    /**
     * Create or retrieve a Stripe Customer for the given workspace.
     *
     * Storing the stripe_customer_id in our subscriptions table prevents
     * duplicate customers in Stripe and links all future invoices to one place.
     */
    public function getOrCreateCustomer(Workspace $workspace, ?string $userEmail = null, ?string $userName = null): string
    {
        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($subscription?->stripe_customer_id) {
            return (string) $subscription->stripe_customer_id;
        }

        // Create a new Customer in Stripe
        $response = $this->client()->post('/customers', [
            'name' => $userName ?? $workspace->name,
            'email' => $userEmail,
            'metadata' => [
                'workspace_id' => (string) $workspace->id,
                'workspace_name' => (string) $workspace->name,
            ],
        ]);

        $this->ensureSuccessfulResponse($response, 'Failed to create Stripe customer.');

        $customerId = (string) $response->json('id');

        // Link customer id to subscription record
        Subscription::query()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'plan_id' => $subscription?->plan_id ?? Plan::query()->where('slug', Plan::SLUG_FREE)->value('id'),
                'stripe_customer_id' => $customerId,
            ]
        );

        return $customerId;
    }

    /**
     * Create a Stripe Checkout Session for subscribing to a paid plan.
     *
     * Returns the redirect URL where the user will securely complete their payment.
     */
    public function createCheckoutSession(
        Workspace $workspace,
        Plan $plan,
        string $billingInterval,
        string $successUrl,
        string $cancelUrl,
        ?string $userEmail = null,
        ?string $userName = null
    ): string {
        if ($plan->isFree()) {
            throw new RuntimeException('Cannot create a Stripe checkout session for the Free plan.');
        }

        $customerId = $this->getOrCreateCustomer($workspace, $userEmail, $userName);

        $isYearly = $billingInterval === Subscription::INTERVAL_YEARLY;
        $priceId = $isYearly ? $plan->stripe_yearly_price_id : $plan->stripe_monthly_price_id;

        $payload = [
            'customer' => $customerId,
            'mode' => 'subscription',
            'client_reference_id' => (string) $workspace->id,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => [
                'workspace_id' => (string) $workspace->id,
                'plan_id' => (string) $plan->id,
                'plan_slug' => (string) $plan->slug,
                'billing_interval' => $billingInterval,
            ],
            'subscription_data' => [
                'metadata' => [
                    'workspace_id' => (string) $workspace->id,
                    'plan_id' => (string) $plan->id,
                    'plan_slug' => (string) $plan->slug,
                    'billing_interval' => $billingInterval,
                ],
            ],
        ];

        // If a pre-configured Stripe Price ID exists, use it.
        // Otherwise, dynamically generate price_data so checkout works out-of-the-box!
        if ($priceId) {
            $payload['line_items'] = [
                [
                    'price' => $priceId,
                    'quantity' => 1,
                ],
            ];
        } else {
            $amountCents = $isYearly
                ? (int) ($plan->price_yearly ?? ($plan->price_monthly * 10))
                : (int) $plan->price_monthly;

            $intervalUnit = $isYearly ? 'year' : 'month';

            $payload['line_items'] = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => $amountCents,
                        'recurring' => [
                            'interval' => $intervalUnit,
                        ],
                        'product_data' => [
                            'name' => "{$plan->name} Plan ({$billingInterval})",
                            'description' => $plan->description ?? "{$plan->name} tier subscription",
                        ],
                    ],
                ],
            ];
        }

        $response = $this->client()->post('/checkout/sessions', $payload);

        $this->ensureSuccessfulResponse($response, 'Failed to create Stripe Checkout session.');

        return (string) $response->json('url');
    }

    /**
     * Retrieve a Checkout Session from Stripe to verify payment.
     *
     * @return array<string, mixed>
     */
    public function getCheckoutSession(string $sessionId): array
    {
        $response = $this->client()->get("/checkout/sessions/{$sessionId}");

        $this->ensureSuccessfulResponse($response, 'Failed to retrieve Checkout session from Stripe.');

        return (array) $response->json();
    }

    /**
     * Create a Stripe Customer Portal session.
     *
     * Allows customers to manage payment methods, download invoices, and cancel recurring plans.
     */
    public function createPortalSession(string $stripeCustomerId, string $returnUrl): string
    {
        $response = $this->client()->post('/billing_portal/sessions', [
            'customer' => $stripeCustomerId,
            'return_url' => $returnUrl,
        ]);

        $this->ensureSuccessfulResponse($response, 'Failed to create Stripe Customer Portal session.');

        return (string) $response->json('url');
    }

    /**
     * Cancel an active Stripe subscription.
     *
     * By default, sets cancel_at_period_end=true so the customer keeps paid benefits
     * until the current billing cycle ends without renewing.
     *
     * @return array<string, mixed>
     */
    public function cancelSubscription(string $stripeSubscriptionId, bool $atPeriodEnd = true): array
    {
        if ($atPeriodEnd) {
            $response = $this->client()->post("/subscriptions/{$stripeSubscriptionId}", [
                'cancel_at_period_end' => 'true',
            ]);
        } else {
            $response = $this->client()->delete("/subscriptions/{$stripeSubscriptionId}");
        }

        $this->ensureSuccessfulResponse($response, 'Failed to cancel Stripe subscription.');

        return (array) $response->json();
    }

    /**
     * Resume a canceled subscription before its period ends.
     *
     * Removes the pending cancellation (cancel_at_period_end=false).
     *
     * @return array<string, mixed>
     */
    public function resumeSubscription(string $stripeSubscriptionId): array
    {
        $response = $this->client()->post("/subscriptions/{$stripeSubscriptionId}", [
            'cancel_at_period_end' => 'false',
        ]);

        $this->ensureSuccessfulResponse($response, 'Failed to resume Stripe subscription.');

        return (array) $response->json();
    }

    /**
     * Verify Stripe webhook signature with HMAC-SHA256 (Native, without external SDK).
     *
     * Prevents forgery and replay attacks.
     * Stripe signature format: t=1492774577,v1=5257a869e7ecebeda32affa62cd4923...
     */
    public function verifyWebhookSignature(
        string $payload,
        string $signatureHeader,
        ?string $secret = null,
        int $toleranceSeconds = 300
    ): bool {
        $secretKey = $secret ?? $this->webhookSecret ?? (string) config('services.stripe.webhook_secret');

        if ($secretKey === '' || $signatureHeader === '') {
            return false;
        }

        $timestamp = null;
        $signatures = [];

        // Parse t=... and v1=... from the header
        $items = explode(',', $signatureHeader);
        foreach ($items as $item) {
            $parts = explode('=', trim($item), 2);
            if (count($parts) === 2) {
                if ($parts[0] === 't') {
                    $timestamp = (int) $parts[1];
                } elseif ($parts[0] === 'v1') {
                    $signatures[] = $parts[1];
                }
            }
        }

        if ($timestamp === null || empty($signatures)) {
            return false;
        }

        // Prevent replay attacks by checking timestamp tolerance (default 5 minutes)
        if (abs(time() - $timestamp) > $toleranceSeconds) {
            return false;
        }

        // Compute expected signature
        $signedPayload = "{$timestamp}.{$payload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secretKey);

        foreach ($signatures as $sig) {
            if (hash_equals($expectedSignature, $sig)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Helper to throw clean exception if Stripe API returns an error response.
     */
    private function ensureSuccessfulResponse(Response $response, string $fallbackMessage): void
    {
        if ($response->successful()) {
            return;
        }

        $errorMessage = $response->json('error.message') ?? $fallbackMessage;
        throw new RuntimeException("Stripe API Error: {$errorMessage} (Status: {$response->status()})");
    }
}
