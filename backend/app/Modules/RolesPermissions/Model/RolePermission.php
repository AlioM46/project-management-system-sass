<?php

namespace App\Modules\RolesPermissions\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pivot model between roles and permissions.
 *
 * Example row:
 * - role_id: 5
 * - permission_id: 19
 * - permission_key: "task.assign"
 */
class RolePermission extends Model
{
    protected $table = 'role_permissions';

    protected $fillable = [
        'role_id',
        'permission_id',
        'permission_key',
    ];

    /**
     * Workspace role side of the pivot.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Permission side of the pivot.
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }
}
