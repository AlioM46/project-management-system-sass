<?php

namespace App\Modules\Workspace\Model;

use App\Models\User;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workspace_Members extends Model
{
    use BelongsToWorkspace;

    protected $table = 'workspace_members';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'role_id',
        'joined_at',
    ];

    protected $casts = [
        'role_id' => 'integer',
        'joined_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function isOwner(): bool
    {
        return $this->role && $this->role->isOwnerRole();
    }

    public function isAdmin(): bool
    {
        return $this->role && $this->role->isAdminRole();
    }

    public function isOwnerOrAdmin(): bool
    {
        return $this->isOwner() || $this->isAdmin();
    }

    public function isMember(): bool
    {
        return $this->role && $this->role->isMemberRole();
    }
}
