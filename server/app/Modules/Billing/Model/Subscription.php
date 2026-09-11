<?php

declare(strict_types=1);

namespace App\Modules\Billing\Model;

use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_CANCELED = 'canceled';
    public const STATUS_TRIALING = 'trialing';

    public const INTERVAL_MONTHLY = 'monthly';
    public const INTERVAL_YEARLY = 'yearly';

    protected $table = 'subscriptions';

    protected $fillable = [
        'workspace_id',
        'plan_id',
        'status',
        'billing_interval',
        'stripe_customer_id',
        'stripe_subscription_id',
        'current_period_end',
        'trial_ends_at',
        'canceled_at',
    ];

    protected $casts = [
        'workspace_id' => 'integer',
        'plan_id' => 'integer',
        'current_period_end' => 'datetime',
        'trial_ends_at' => 'datetime',
        'canceled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    /**
     * Determine whether the subscription is in good standing.
     */
    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_ACTIVE, self::STATUS_TRIALING], true);
    }

    /**
     * Determine whether payment is past due.
     */
    public function isPastDue(): bool
    {
        return $this->status === self::STATUS_PAST_DUE;
    }

    /**
     * Determine whether subscription was canceled.
     */
    public function isCanceled(): bool
    {
        return $this->canceled_at !== null || $this->status === self::STATUS_CANCELED;
    }

    /**
     * Scope query to a specific workspace.
     */
    public function scopeForWorkspace(Builder $query, int $workspaceId): Builder
    {
        return $query->where('workspace_id', $workspaceId);
    }

    /**
     * Scope query to active subscriptions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_ACTIVE, self::STATUS_TRIALING]);
    }
}
