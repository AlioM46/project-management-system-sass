<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Actions\HandleStripeWebhook;
use App\Modules\Billing\Services\StripeService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Endpoint for incoming Stripe webhook events.
 */
class StripeWebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook requests.
     */
    public function handle(
        Request $request,
        StripeService $stripeService,
        HandleStripeWebhook $action
    ): JsonResponse {
        $payload = (string) $request->getContent();
        $signature = (string) $request->header('Stripe-Signature');

        $webhookSecret = (string) config('services.stripe.webhook_secret');

        // Verify signature if a webhook secret is configured
        if ($webhookSecret !== '') {
            $isValid = $stripeService->verifyWebhookSignature(
                payload: $payload,
                signatureHeader: $signature,
                secret: $webhookSecret
            );

            if (!$isValid) {
                Log::warning('Billing: Stripe webhook signature verification failed.');

                return ApiResponse::error(
                    message: 'Invalid Stripe signature header.',
                    code: 'INVALID_STRIPE_SIGNATURE',
                    status: 400
                );
            }
        }

        $event = json_decode($payload, true);

        if (!is_array($event) || !isset($event['type'])) {
            return ApiResponse::error(
                message: 'Invalid JSON payload structure.',
                code: 'INVALID_WEBHOOK_PAYLOAD',
                status: 400
            );
        }

        $result = $action->execute($event);

        return ApiResponse::success(
            message: $result['message'],
            data: $result
        );
    }
}
