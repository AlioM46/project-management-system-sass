<?php

declare(strict_types=1);

namespace App\Modules\Billing\Model;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    public const SLUG_FREE = 'free';
    public const SLUG_PRO = 'pro';
    public const SLUG_ENTERPRISE = 'enterprise';

    protected $table = 'plans';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'stripe_monthly_price_id',
        'stripe_yearly_price_id',
        'max_members',
        'max_projects',
        'max_tasks_per_project',
        'max_storage_mb',
        'max_file_size_mb',
        'max_custom_roles',
        'has_audit_logs',
        'has_advanced_analytics',
        'has_data_export',
        'has_priority_support',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'integer',
        'price_yearly' => 'integer',
        'max_members' => 'integer',
        'max_projects' => 'integer',
        'max_tasks_per_project' => 'integer',
        'max_storage_mb' => 'integer',
        'max_file_size_mb' => 'integer',
        'max_custom_roles' => 'integer',
        'has_audit_logs' => 'boolean',
        'has_advanced_analytics' => 'boolean',
        'has_data_export' => 'boolean',
        'has_priority_support' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope query to only include active plans.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to order by configured sort order.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }

    /**
     * Check if this is the free plan.
     */
    public function isFree(): bool
    {
        return $this->slug === self::SLUG_FREE || $this->price_monthly === 0;
    }

    /**
     * Check if a specific limit column is unlimited (null).
     */
    public function isUnlimited(string $limitColumn): bool
    {
        return $this->{$limitColumn} === null;
    }

    /**
     * Check if a boolean feature gate is enabled.
     */
    public function hasFeature(string $featureGate): bool
    {
        return (bool) ($this->{$featureGate} ?? false);
    }
}
