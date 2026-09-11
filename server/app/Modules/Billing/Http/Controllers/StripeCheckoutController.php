<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Http\Requests\CreateCheckoutSessionRequest;
use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Billing\Services\StripeService;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Handles Stripe Checkout Session creation and Customer Portal redirects.
 */
class StripeCheckoutController extends Controller
{
    /**
     * Create a Stripe Checkout session to subscribe to a paid plan.
     */
    public function checkout(
        CreateCheckoutSessionRequest $request,
        StripeService $stripeService,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {

        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$workspaceContext->isOwnerOrAdmin()) {
            throw WorkspaceContextException::workspaceNotManagedByUser(
                username: $request->user()?->name ?? 'Current User',
                workspaceId: (int) $workspace->id
            );
        }

        /** @var Plan $plan */
        $plan = Plan::query()->where('slug', $request->validated('plan_slug'))->firstOrFail();

        $billingInterval = (string) ($request->validated('billing_interval') ?? Subscription::INTERVAL_MONTHLY);

        // ?: it sets default value of env(FRONTEND_URL) is not valid (have many cases)
        $frontendUrl = rtrim((string) (env('FRONTEND_URL') ?: 'http://localhost:3000'), '/');

        // ??: (also have many cases)
        $successUrl = (string) ($request->validated('success_url')
            ?? "{$frontendUrl}/dashboard/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true");

        $cancelUrl = (string) ($request->validated('cancel_url')
            ?? "{$frontendUrl}/dashboard/settings/billing?canceled=true");

        $user = $request->user();

        $checkoutUrl = $stripeService->createCheckoutSession(
            workspace: $workspace,
            plan: $plan,
            billingInterval: $billingInterval,
            successUrl: $successUrl,
            cancelUrl: $cancelUrl,
            userEmail: $user?->email,
            userName: $user?->name
        );

        return ApiResponse::success(
            message: 'Checkout session created successfully.',
            data: [
                'checkout_url' => $checkoutUrl,
                'plan_slug' => $plan->slug,
                'billing_interval' => $billingInterval,
            ]
        );
    }

    /**
     * Create a Stripe Customer Portal session to manage cards, invoices, and cancellation.
     */
    public function portal(
        Request $request,
        StripeService $stripeService,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$workspaceContext->isOwnerOrAdmin()) {
            throw WorkspaceContextException::workspaceNotManagedByUser(
                username: $request->user()?->name ?? 'Current User',
                workspaceId: (int) $workspace->id
            );
        }

        $user = $request->user();
        $customerId = $stripeService->getOrCreateCustomer($workspace, $user?->email, $user?->name);

        $frontendUrl = rtrim((string) (env('FRONTEND_URL') ?: 'http://localhost:3000'), '/');
        $returnUrl = (string) ($request->query('return_url') ?? "{$frontendUrl}/dashboard/settings/billing");

        $portalUrl = $stripeService->createPortalSession($customerId, $returnUrl);

        return ApiResponse::success(
            message: 'Customer portal session created successfully.',
            data: [
                'portal_url' => $portalUrl,
            ]
        );
    }

    /**
     * Confirm a completed checkout session upon frontend return (Fallback / instant activation).
     */
    public function confirm(
        Request $request,
        StripeService $stripeService,
        \App\Modules\Billing\Actions\HandleStripeWebhook $webhookHandler,
        \App\Modules\Billing\Actions\GetSubscriptionSummaryAction $getSummaryAction,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $sessionId = (string) $request->input('session_id');

        if ($sessionId === '') {
            return ApiResponse::error(
                message: 'Missing session_id parameter.',
                code: 'INVALID_SESSION_ID',
                status: 400
            );
        }

        $session = $stripeService->getCheckoutSession($sessionId);

        $paymentStatus = (string) ($session['payment_status'] ?? '');
        $status = (string) ($session['status'] ?? '');

        if ($paymentStatus === 'paid' || $status === 'complete') {
            $webhookHandler->execute([
                'type' => 'checkout.session.completed',
                'data' => [
                    'object' => $session,
                ],
            ]);
        }

        $data = $getSummaryAction->execute($workspace);

        return ApiResponse::success(
            message: 'Subscription confirmed successfully.',
            data: (new \App\Modules\Billing\Http\Resources\SubscriptionResource($data))->resolve()
        );
    }
}
