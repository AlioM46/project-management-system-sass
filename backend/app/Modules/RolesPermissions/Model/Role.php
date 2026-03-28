<?php

namespace App\Modules\RolesPermissions\Model;

use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Workspace role.
 *
 * Example rows:
 * - Owner in workspace 1
 * - Admin in workspace 1
 * - Member in workspace 1
 *
 * This model is tenant-scoped by workspace_id.
 */
class Role extends Model
{
    use BelongsToWorkspace;

    protected $table = 'roles';

    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * Workspace that owns this role.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    /**
     * Raw pivot rows between this role and permissions.
     */
    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class, 'role_id');
    }

    /**
     * Permission models attached to this role.
     *
     * Result example:
     * Role "Admin" -> [workspace.view, member.invite, task.assign, ...]
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        )->withPivot('permission_key')->withTimestamps();
    }
}
