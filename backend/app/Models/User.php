<?php

namespace App\Models;

use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'username', 'email', 'password', 'status',
        'last_login_at', 'last_login_ip',
        'refresh_token', 'refresh_token_expiration',
    ];

    protected $hidden = [
        'password', 'deleted_at',
        'refresh_token', 'refresh_token_expiration',
    ];

    protected $casts = [
        'refresh_token_expiration' => 'datetime',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function setPasswordAttribute($value): void
    {
        if (! empty($value)) {
            $this->attributes['password'] = password_get_info($value)['algo'] !== null
                ? $value
                : Hash::make($value);
        }
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'user' => [
                'id' => $this->id,
                'name' => $this->name,
                'username' => $this->username,
                'email' => $this->email,
                'status' => $this->status,
            ],
        ];
    }

    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'created_by_user_id');
    }

    public function workspaceMemberships(): HasMany
    {
        return $this->hasMany(Workspace_Members::class, 'user_id')
            ->withoutGlobalScope(WorkspaceTenantScope::class);
    }

    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members', 'user_id', 'workspace_id')
            ->withPivot(['role_id', 'joined_at'])
            ->withTimestamps();
    }

    public function sentWorkspaceInvitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class, 'invited_by_user_id');
    }

    public function acceptedWorkspaceInvitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class, 'accepted_by_user_id');
    }

    /**
     * Check if the user has a permission in a workspace.
     */
    public function hasPermission(string $permissionName, ?Workspace $workspace = null): bool
    {
        // Get current workspace from the context service if null
        if ($workspace === null) {
            $workspaceContext = app(WorkspaceContextService::class);
            $workspace = $workspaceContext->currentWorkspace();

            // If still null, cannot check
            if (! $workspace) {
                return false;
            }
        }

        // Owner bypass: creator of workspace has all permissions
        // if ($workspace->created_by_user_id === $this->id) {
        //     return true;
        // }

        // Get membership
        $membership = $this->workspaceMemberships()
            ->where('workspace_id', $workspace->id)
            ->first();

        if (! $membership || ! $membership->role) {
            return false;
        }

        $isExist = $membership->role->permissions()
            ->where('key', $permissionName)
            ->exists();

        // Check role permissions
        return $isExist;
    }
}
