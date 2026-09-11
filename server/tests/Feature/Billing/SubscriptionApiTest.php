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
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeSubscriptionTestUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace([' ', '.'], '', $name)) . rand(100, 999),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('returns default free plan and live usage meters for newly created workspace', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeSubscriptionTestUser('Sub Owner', 'sub-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Sub Test Workspace'], $owner);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/billing/subscription');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.plan.slug', Plan::SLUG_FREE)
        ->assertJsonPath('data.plan.name', 'Free')
        ->assertJsonPath('data.is_paid_plan', false)
        ->assertJsonPath('data.usage.members.current', 1)
        ->assertJsonPath('data.usage.members.max', 5)
        ->assertJsonPath('data.usage.projects.current', 0)
        ->assertJsonPath('data.usage.projects.max', 3);
});

it('allows workspace owner to assign a plan with custom interval', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeSubscriptionTestUser('Admin Owner', 'admin-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Upgrade Workspace'], $owner);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/subscription/assign', [
            'plan_slug' => Plan::SLUG_PRO,
            'billing_interval' => Subscription::INTERVAL_YEARLY,
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.plan.slug', Plan::SLUG_PRO)
        ->assertJsonPath('data.is_paid_plan', true)
        ->assertJsonPath('data.subscription.status', 'active')
        ->assertJsonPath('data.subscription.billing_interval', 'yearly');

    $this->assertDatabaseHas('subscriptions', [
        'workspace_id' => $workspace->id,
        'status' => 'active',
        'billing_interval' => 'yearly',
    ]);
});

it('blocks non-admin members from assigning a plan', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeSubscriptionTestUser('Real Owner', 'real-owner@example.com');
    $normalMember = makeSubscriptionTestUser('Normal Member', 'normal-member@example.com');

    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Protected Workspace'], $owner);

    $memberRole = Role::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('name', 'Member')
        ->firstOrFail();

    Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $normalMember->id,
        'role_id' => $memberRole->id,
        'joined_at' => now(),
    ]);

    $response = $this->withToken(JWTAuth::fromUser($normalMember))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/billing/subscription/assign', [
            'plan_slug' => Plan::SLUG_PRO,
        ]);

    $response->assertStatus(403);
});
