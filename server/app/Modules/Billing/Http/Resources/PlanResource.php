<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Resources;

use App\Modules\Billing\Model\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Plan
 */
class PlanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) $this->name,
            'slug' => (string) $this->slug,
            'description' => $this->description ? (string) $this->description : null,
            'pricing' => [
                'monthly' => [
                    'amount_cents' => (int) $this->price_monthly,
                    'amount_formatted' => '$' . number_format($this->price_monthly / 100, 2),
                ],
                'yearly' => [
                    'amount_cents' => $this->price_yearly !== null ? (int) $this->price_yearly : null,
                    'amount_formatted' => $this->price_yearly !== null ? '$' . number_format($this->price_yearly / 100, 2) : null,
                ],
            ],
            'limits' => [
                'max_members' => $this->max_members !== null ? (int) $this->max_members : null,
                'max_projects' => $this->max_projects !== null ? (int) $this->max_projects : null,
                'max_tasks_per_project' => $this->max_tasks_per_project !== null ? (int) $this->max_tasks_per_project : null,
                'max_storage_mb' => $this->max_storage_mb !== null ? (int) $this->max_storage_mb : null,
                'max_file_size_mb' => $this->max_file_size_mb !== null ? (int) $this->max_file_size_mb : null,
                'max_custom_roles' => $this->max_custom_roles !== null ? (int) $this->max_custom_roles : null,
            ],
            'features' => [
                'has_audit_logs' => (bool) $this->has_audit_logs,
                'has_advanced_analytics' => (bool) $this->has_advanced_analytics,
                'has_data_export' => (bool) $this->has_data_export,
                'has_priority_support' => (bool) $this->has_priority_support,
            ],
            'is_free' => $this->isFree(),
            'sort_order' => (int) $this->sort_order,
        ];
    }
}
