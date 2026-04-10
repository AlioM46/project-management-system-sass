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

    public const OWNER_SLUG = 'owner';
    public const ADMIN_SLUG = 'admin';
    public const MEMBER_SLUG = 'member';

    public const RESERVED_SLUGS = [
        self::OWNER_SLUG,
        self::ADMIN_SLUG,
        self::MEMBER_SLUG,
    ];

    protected $table = 'roles';

    protected $fillable = [
        'workspace_id',
        'name',
        'slug',
        'description',
        'is_system',
        'is_editable',
        'is_deletable',
        // PermissionsCount or Power of this role 
        // to help developer infers which is default role to assign when inviting a member without specifying a role.
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_editable' => 'boolean',
        'is_deletable' => 'boolean',
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

    public function workspaceMembers(): HasMany
    {
        return $this->hasMany(\App\Modules\Workspace\Model\Workspace_Members::class, 'role_id');
    }

    public function WeakestRole() {
        return $this->query()
        ->withCount("permissions")
        ->orderBy('permissions_count', 'asc')
        ->first();
    }
     public function StrongestRole() {
        return $this->query()
        ->withCount("permissions")
        ->orderBy('permissions_count', 'desc')
        ->first();
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

    public function isOwnerRole(): bool
    {
        return $this->slug === self::OWNER_SLUG;
    }

    public function isAdminRole(): bool
    {
        return $this->slug === self::ADMIN_SLUG;
    }

    public function isMemberRole(): bool
    {
        return $this->slug === self::MEMBER_SLUG;
    }

    public function isProtectedSystemRole(): bool
    {
        return $this->is_system && (!$this->is_editable || !$this->is_deletable);
    }
}
