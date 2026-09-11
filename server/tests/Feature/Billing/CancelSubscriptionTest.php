<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Billing\Database\Seeders\PlanSeeder;
use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeCancelTestUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace([' ', '.'], '', $name)) . rand(100, 999),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('allows workspace owner to cancel a subscription at period end', function (): void {
    $this->seed(PlanSeeder::class);

    Http::fake([
        'https://api.stripe.com/v1/subscriptions/*' => Http::response([
            'id' => 'sub_cancel_test_123',
            'cancel_at_period_end' => true,
        ], 200),
    ]);

    $owner = makeCancelTestUser('Owner User', 'cancel-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Cancel Test Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();
    Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'billing_interval' => Subscription::INTERVAL_MONTHLY,
        'stripe_subscription_id' => 'sub_cancel_test_123',
        'current_period_end' => now()->addMonth(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/subscription/cancel');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.subscription.is_canceled', true);

    $subscription = Subscription::query()->where('workspace_id', $workspace->id)->first();
    expect($subscription->canceled_at)->not->toBeNull();
});

it('allows workspace owner to resume a canceled subscription before period ends', function (): void {
    $this->seed(PlanSeeder::class);

    Http::fake([
        'https://api.stripe.com/v1/subscriptions/*' => Http::response([
            'id' => 'sub_cancel_test_123',
            'cancel_at_period_end' => false,
        ], 200),
    ]);

    $owner = makeCancelTestUser('Owner User 2', 'cancel-owner2@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Resume Test Workspace'], $owner);

    $proPlan = Plan::query()->where('slug', Plan::SLUG_PRO)->firstOrFail();
    Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => Subscription::STATUS_ACTIVE,
        'billing_interval' => Subscription::INTERVAL_MONTHLY,
        'stripe_subscription_id' => 'sub_cancel_test_123',
        'canceled_at' => now()->subDay(),
        'current_period_end' => now()->addMonth(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/subscription/resume');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.subscription.is_canceled', false);

    $subscription = Subscription::query()->where('workspace_id', $workspace->id)->first();
    expect($subscription->canceled_at)->toBeNull();
});

it('blocks non-admin members from canceling a subscription', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeCancelTestUser('Owner User 3', 'cancel-owner3@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Block Cancel Workspace'], $owner);

    $member = makeCancelTestUser('Regular Member', 'regular-member@example.com');
    $memberRole = Role::withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('slug', 'member')
        ->firstOrFail();

    Workspace_Members::withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspace->id,
        'user_id' => $member->id,
        'role_id' => $memberRole->id,
        'joined_at' => now(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($member))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/subscription/cancel');

    $response->assertForbidden();
});
