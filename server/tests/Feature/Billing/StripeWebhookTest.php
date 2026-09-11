<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Billing\Database\Seeders\PlanSeeder;
use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeWebhookTestUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace([' ', '.'], '', $name)) . rand(100, 999),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('handles checkout.session.completed webhook and provisions subscription', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeWebhookTestUser('Webhook Owner', 'webhook-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Webhook Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();

    $event = [
        'id' => 'evt_test_checkout',
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'client_reference_id' => (string) $workspace->id,
                'customer' => 'cus_webhook_123',
                'subscription' => 'sub_webhook_999',
                'metadata' => [
                    'workspace_id' => (string) $workspace->id,
                    'plan_slug' => Plan::SLUG_PRO,
                    'billing_interval' => Subscription::INTERVAL_YEARLY,
                ],
            ],
        ],
    ];

    $response = $this->postJson('/api/billing/webhooks', $event);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'billing_interval' => Subscription::INTERVAL_YEARLY,
        'stripe_customer_id' => 'cus_webhook_123',
        'stripe_subscription_id' => 'sub_webhook_999',
    ]);
});

it('handles customer.subscription.updated webhook', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeWebhookTestUser('Update Owner', 'update-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Update Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();

    Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'stripe_subscription_id' => 'sub_update_123',
    ]);

    $futureTimestamp = now()->addMonths(6)->timestamp;

    $event = [
        'id' => 'evt_sub_updated',
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'id' => 'sub_update_123',
                'status' => 'past_due',
                'current_period_end' => $futureTimestamp,
            ],
        ],
    ];

    $response = $this->postJson('/api/billing/webhooks', $event);

    $response->assertOk();

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'status' => 'past_due',
    ]);
});

it('handles customer.subscription.deleted webhook by downgrading to free', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeWebhookTestUser('Delete Owner', 'delete-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Delete Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();
    $freePlan = Plan::query()->where('slug', Plan::SLUG_FREE)->firstOrFail();

    Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'stripe_subscription_id' => 'sub_cancel_123',
    ]);

    $event = [
        'id' => 'evt_sub_deleted',
        'type' => 'customer.subscription.deleted',
        'data' => [
            'object' => [
                'id' => 'sub_cancel_123',
            ],
        ],
    ];

    $response = $this->postJson('/api/billing/webhooks', $event);

    $response->assertOk();

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'plan_id' => $freePlan->id,
        'status' => Subscription::STATUS_CANCELED,
    ]);
});

it('handles invoice.payment_failed webhook and marks status as past_due', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeWebhookTestUser('Invoice Owner', 'invoice-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Invoice Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();

    Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'stripe_subscription_id' => 'sub_invoice_fail_123',
    ]);

    $event = [
        'id' => 'evt_invoice_failed',
        'type' => 'invoice.payment_failed',
        'data' => [
            'object' => [
                'subscription' => 'sub_invoice_fail_123',
            ],
        ],
    ];

    $response = $this->postJson('/api/billing/webhooks', $event);

    $response->assertOk();

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'status' => Subscription::STATUS_PAST_DUE,
    ]);
});

it('verifies Stripe webhook signature and rejects forged requests', function (): void {
    $this->seed(PlanSeeder::class);

    config(['services.stripe.webhook_secret' => 'whsec_test_secret_123']);

    $payload = json_encode([
        'id' => 'evt_sig_test',
        'type' => 'customer.subscription.updated',
        'data' => ['object' => []],
    ]);

    // Request with invalid signature header should be rejected
    $invalidResponse = $this->call(
        'POST',
        '/api/billing/webhooks',
        [],
        [],
        [],
        ['HTTP_STRIPE_SIGNATURE' => 't=123456,v1=bad_signature'],
        $payload
    );

    $invalidResponse->assertStatus(400)
        ->assertJsonPath('error.code', 'INVALID_STRIPE_SIGNATURE');

    // Request with valid signature should succeed
    $timestamp = time();
    $validSignature = hash_hmac('sha256', "{$timestamp}.{$payload}", 'whsec_test_secret_123');
    $validHeader = "t={$timestamp},v1={$validSignature}";

    $validResponse = $this->call(
        'POST',
        '/api/billing/webhooks',
        [],
        [],
        [],
        ['HTTP_STRIPE_SIGNATURE' => $validHeader],
        $payload
    );

    $validResponse->assertOk()
        ->assertJsonPath('success', true);
});
