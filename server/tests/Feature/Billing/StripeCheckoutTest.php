<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Billing\Database\Seeders\PlanSeeder;
use App\Modules\Billing\Model\Plan;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeStripeCheckoutTestUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace([' ', '.'], '', $name)) . rand(100, 999),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('creates a Stripe checkout session for a paid plan', function (): void {
    $this->seed(PlanSeeder::class);

    // Mock Stripe REST API responses
    Http::fake([
        'https://api.stripe.com/v1/customers' => Http::response([
            'id' => 'cus_mock12345',
            'object' => 'customer',
        ], 200),
        'https://api.stripe.com/v1/checkout/sessions' => Http::response([
            'id' => 'cs_mock98765',
            'object' => 'checkout.session',
            'url' => 'https://checkout.stripe.com/c/pay/cs_mock98765',
        ], 200),
    ]);

    $owner = makeStripeCheckoutTestUser('Stripe Owner', 'stripe-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Stripe Checkout Workspace'], $owner);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/checkout', [
            'plan_slug' => Plan::SLUG_PRO,
            'billing_interval' => 'yearly',
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Checkout session created successfully.')
        ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/c/pay/cs_mock98765')
        ->assertJsonPath('data.plan_slug', Plan::SLUG_PRO)
        ->assertJsonPath('data.billing_interval', 'yearly');

    // Verify Stripe customer id was persisted locally
    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'stripe_customer_id' => 'cus_mock12345',
    ]);
});

it('creates a Stripe customer portal session', function (): void {
    $this->seed(PlanSeeder::class);

    Http::fake([
        'https://api.stripe.com/v1/customers' => Http::response([
            'id' => 'cus_mock_portal',
            'object' => 'customer',
        ], 200),
        'https://api.stripe.com/v1/billing_portal/sessions' => Http::response([
            'id' => 'bps_mock123',
            'object' => 'billing_portal.session',
            'url' => 'https://billing.stripe.com/p/session/bps_mock123',
        ], 200),
    ]);

    $owner = makeStripeCheckoutTestUser('Portal Owner', 'portal-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Portal Workspace'], $owner);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/billing/portal');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.portal_url', 'https://billing.stripe.com/p/session/bps_mock123');
});

it('blocks non-admin members from initiating checkout', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeStripeCheckoutTestUser('Owner User', 'owner-block@example.com');
    $member = makeStripeCheckoutTestUser('Member User', 'member-block@example.com');

    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Block Test Workspace'], $owner);

    $memberRole = Role::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('name', 'Member')
        ->firstOrFail();

    Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $member->id,
        'role_id' => $memberRole->id,
        'joined_at' => now(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($member))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/checkout', [
            'plan_slug' => Plan::SLUG_PRO,
        ]);

    $response->assertStatus(403);
});

it('confirms a completed checkout session upon frontend redirect return', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeStripeCheckoutTestUser('Confirm Owner', 'confirm-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Confirm Workspace'], $owner);
    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();

    Http::fake([
        'https://api.stripe.com/v1/checkout/sessions/cs_confirm_123' => Http::response([
            'id' => 'cs_confirm_123',
            'object' => 'checkout.session',
            'status' => 'complete',
            'payment_status' => 'paid',
            'client_reference_id' => (string) $workspace->id,
            'customer' => 'cus_confirmed_888',
            'subscription' => 'sub_confirmed_999',
            'metadata' => [
                'workspace_id' => (string) $workspace->id,
                'plan_slug' => Plan::SLUG_PRO,
                'billing_interval' => 'monthly',
            ],
        ], 200),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/checkout/confirm', [
            'session_id' => 'cs_confirm_123',
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.plan.slug', Plan::SLUG_PRO)
        ->assertJsonPath('data.is_paid_plan', true)
        ->assertJsonPath('data.subscription.status', 'active');

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => 'active',
        'stripe_subscription_id' => 'sub_confirmed_999',
    ]);
});

