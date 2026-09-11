<?php

declare(strict_types=1);

namespace App\Modules\Billing\Database\Seeders;

use App\Modules\Billing\Model\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => Plan::SLUG_FREE,
                'description' => 'Perfect for small teams and personal projects getting started.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'stripe_monthly_price_id' => null,
                'stripe_yearly_price_id' => null,
                'max_members' => 5,
                'max_projects' => 3,
                'max_tasks_per_project' => 100,
                'max_storage_mb' => 500,
                'max_file_size_mb' => 10,
                'max_custom_roles' => 0,
                'has_audit_logs' => false,
                'has_advanced_analytics' => false,
                'has_data_export' => false,
                'has_priority_support' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Pro',
                'slug' => Plan::SLUG_PRO,
                'description' => 'Supercharge your team with unlimited projects, advanced analytics, and expanded storage.',
                'price_monthly' => 1500,
                'price_yearly' => 15000,
                'stripe_monthly_price_id' => null,
                'stripe_yearly_price_id' => null,
                'max_members' => 25,
                'max_projects' => null,
                'max_tasks_per_project' => null,
                'max_storage_mb' => 20480, // 20 GB
                'max_file_size_mb' => 100,
                'max_custom_roles' => 10,
                'has_audit_logs' => true,
                'has_advanced_analytics' => true,
                'has_data_export' => true,
                'has_priority_support' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => Plan::SLUG_ENTERPRISE,
                'description' => 'Maximum scale, custom security controls, priority support, and complete flexibility.',
                'price_monthly' => 4900,
                'price_yearly' => 49000,
                'stripe_monthly_price_id' => null,
                'stripe_yearly_price_id' => null,
                'max_members' => null,
                'max_projects' => null,
                'max_tasks_per_project' => null,
                'max_storage_mb' => null,
                'max_file_size_mb' => 500,
                'max_custom_roles' => null,
                'has_audit_logs' => true,
                'has_advanced_analytics' => true,
                'has_data_export' => true,
                'has_priority_support' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::query()->updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
