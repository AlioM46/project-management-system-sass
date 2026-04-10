<?php

namespace App\Modules\RolesPermissions\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Global permission definition.
 *
 * Example rows:
 * - workspace.view
 * - role.assign
 * - task.change_status
 *
 * This model is global, not workspace-scoped.
 */
class Permission extends Model
{
    protected $table = 'permissions';

    protected $fillable = [
        'key',
        'name',
        'description',
    ];

    /**
     * Raw pivot rows pointing to this permission.
     */
    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class, 'permission_id');
    }

    /**
     * Workspace roles that use this permission.
     *
     * Result example:
     * Permission "task.assign" -> [Admin role, Owner role]
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_permissions',
            'permission_id',
            'role_id'
        )->withPivot('permission_key')->withTimestamps();
    }
}
