<?php

declare(strict_types=1);

use App\Modules\Billing\Http\Controllers\PlanController;
use App\Modules\Billing\Http\Controllers\StripeCheckoutController;
use App\Modules\Billing\Http\Controllers\StripeWebhookController;
use App\Modules\Billing\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::prefix('billing')->group(function (): void {
    // Public pricing catalog
    Route::get('/plans', [PlanController::class, 'index'])->name('billing.plans.index');

    // Public Stripe webhook listener (Signature verified inside controller)
    Route::post('/webhooks', [StripeWebhookController::class, 'handle'])->name('billing.webhooks');

    // Authenticated & Workspace-scoped subscription management
    Route::middleware(['auth:api', 'workspace.context'])->group(function (): void {
        // Show current workspace plan and live usage meters
        Route::get('/subscription', [SubscriptionController::class, 'show'])->name('billing.subscription.show');

        // Manual plan assignment (Owner/Admin only)
        Route::post('/subscription/assign', [SubscriptionController::class, 'assign'])->name('billing.subscription.assign');

        // Cancel active subscription (downgrade to Free)
        Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])->name('billing.subscription.cancel');

        // Resume canceled subscription before period ends
        Route::post('/subscription/resume', [SubscriptionController::class, 'resume'])->name('billing.subscription.resume');

        // Stripe Checkout session initialization
        Route::post('/checkout', [StripeCheckoutController::class, 'checkout'])->name('billing.checkout');

        // Confirm session on return (Fallback / instant activation)
        Route::post('/checkout/confirm', [StripeCheckoutController::class, 'confirm'])->name('billing.checkout.confirm');

        // Stripe Customer Portal redirect URL generator
        Route::get('/portal', [StripeCheckoutController::class, 'portal'])->name('billing.portal');
    });
});
