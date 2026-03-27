<?php

namespace App\Modules\Workspace\Model;

use App\Models\User;
use App\Modules\Epic\Model\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    protected $table = 'workspaces';

    protected $fillable = [
        'name',
        'created_by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(Workspace_Members::class, 'workspace_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class, 'workspace_id');
    }

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
