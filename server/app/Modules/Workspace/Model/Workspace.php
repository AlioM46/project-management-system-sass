<?php

namespace App\Modules\Workspace\Model;

use App\Models\User;
use App\Modules\Notifications\Model\Notification;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workspace extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'workspaces';

    protected $fillable = [
        'name',
        'created_by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(Workspace_Members::class, 'workspace_id')
            ->withoutGlobalScope(WorkspaceTenantScope::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class, 'workspace_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
    // Scopes and helpers
    public function scopeAccessibleTo(Builder $query, int $userId): Builder
    {
        return $query->where(function (Builder $builder) use ($userId) {
            $builder
                ->where('created_by_user_id', $userId)
                ->orWhereHas('members', function (Builder $membersQuery) use ($userId) {
                    $membersQuery->where('user_id', $userId);
                });
        });
    }

    public function containsRole(int $roleId): bool
    {
        return $this->roles()
            ->where('id', $roleId)
            ->exists();
    }

    public function weakestRole(): ?Role
    {
        return $this->roles()
            ->where(function (Builder $query): void {
                $query->where('slug', '!=', Role::OWNER_SLUG)
                    ->orWhereNull('slug');
            })
            ->withCount('permissions')
            ->orderBy('permissions_count', 'asc')
            ->orderBy('id', 'asc')
            ->first();
    }

    public function containsUser(int $userId): bool
    {
        if ((int) $this->created_by_user_id === $userId) {
            return true;
        }

        return $this->members()
            ->where('user_id', $userId)
            ->exists();
    }

    public function isManagedBy(int $userId): bool
    {
        return (int) $this->created_by_user_id === $userId;
    }
}
