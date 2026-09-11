<?php

declare(strict_types=1);

use App\Modules\Billing\Database\Seeders\PlanSeeder;
use App\Modules\Billing\Model\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('retrieves active plans with correct pricing and all limits', function (): void {
    $this->seed(PlanSeeder::class);

    $response = $this->getJson('/api/billing/plans');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Plans retrieved successfully.')
        ->assertJsonCount(3, 'data.plans');

    $plans = collect($response->json('data.plans'))->keyBy('slug');

    // Verify Free Plan
    $free = $plans->get(Plan::SLUG_FREE);
    expect($free)->not->toBeNull();
    expect($free['name'])->toBe('Free');
    expect($free['pricing']['monthly']['amount_cents'])->toBe(0);
    expect($free['pricing']['monthly']['amount_formatted'])->toBe('$0.00');
    expect($free['pricing']['yearly']['amount_cents'])->toBe(0);
    expect($free['limits']['max_members'])->toBe(5);
    expect($free['limits']['max_projects'])->toBe(3);
    expect($free['limits']['max_tasks_per_project'])->toBe(100);
    expect($free['limits']['max_storage_mb'])->toBe(500);
    expect($free['limits']['max_file_size_mb'])->toBe(10);
    expect($free['limits']['max_custom_roles'])->toBe(0);
    expect($free['features']['has_audit_logs'])->toBeFalse();
    expect($free['features']['has_advanced_analytics'])->toBeFalse();
    expect($free['features']['has_data_export'])->toBeFalse();
    expect($free['features']['has_priority_support'])->toBeFalse();
    expect($free['is_free'])->toBeTrue();

    // Verify Pro Plan
    $pro = $plans->get(Plan::SLUG_PRO);
    expect($pro)->not->toBeNull();
    expect($pro['name'])->toBe('Pro');
    expect($pro['pricing']['monthly']['amount_cents'])->toBe(1500);
    expect($pro['pricing']['monthly']['amount_formatted'])->toBe('$15.00');
    expect($pro['pricing']['yearly']['amount_cents'])->toBe(15000);
    expect($pro['pricing']['yearly']['amount_formatted'])->toBe('$150.00');
    expect($pro['limits']['max_members'])->toBe(25);
    expect($pro['limits']['max_projects'])->toBeNull(); // Unlimited
    expect($pro['limits']['max_tasks_per_project'])->toBeNull(); // Unlimited
    expect($pro['limits']['max_storage_mb'])->toBe(20480);
    expect($pro['limits']['max_file_size_mb'])->toBe(100);
    expect($pro['limits']['max_custom_roles'])->toBe(10);
    expect($pro['features']['has_audit_logs'])->toBeTrue();
    expect($pro['features']['has_advanced_analytics'])->toBeTrue();
    expect($pro['features']['has_data_export'])->toBeTrue();
    expect($pro['features']['has_priority_support'])->toBeFalse();
    expect($pro['is_free'])->toBeFalse();

    // Verify Enterprise Plan
    $enterprise = $plans->get(Plan::SLUG_ENTERPRISE);
    expect($enterprise)->not->toBeNull();
    expect($enterprise['name'])->toBe('Enterprise');
    expect($enterprise['pricing']['monthly']['amount_cents'])->toBe(4900);
    expect($enterprise['pricing']['monthly']['amount_formatted'])->toBe('$49.00');
    expect($enterprise['pricing']['yearly']['amount_cents'])->toBe(49000);
    expect($enterprise['pricing']['yearly']['amount_formatted'])->toBe('$490.00');
    expect($enterprise['limits']['max_members'])->toBeNull(); // Unlimited
    expect($enterprise['limits']['max_projects'])->toBeNull(); // Unlimited
    expect($enterprise['limits']['max_storage_mb'])->toBeNull(); // Unlimited
    expect($enterprise['limits']['max_file_size_mb'])->toBe(500);
    expect($enterprise['limits']['max_custom_roles'])->toBeNull(); // Unlimited
    expect($enterprise['features']['has_audit_logs'])->toBeTrue();
    expect($enterprise['features']['has_priority_support'])->toBeTrue();
    expect($enterprise['is_free'])->toBeFalse();
});

it('filters out inactive plans and respects sort order', function (): void {
    Plan::query()->create([
        'name' => 'Archived Legacy Plan',
        'slug' => 'legacy',
        'price_monthly' => 900,
        'is_active' => false,
        'sort_order' => 0,
    ]);

    Plan::query()->create([
        'name' => 'Active Starter',
        'slug' => 'starter',
        'price_monthly' => 500,
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $response = $this->getJson('/api/billing/plans');

    $response->assertOk()
        ->assertJsonCount(1, 'data.plans');

    $planSlugs = collect($response->json('data.plans'))->pluck('slug')->all();
    expect($planSlugs)->toEqual(['starter'])
        ->and($planSlugs)->not->toContain('legacy');
});
