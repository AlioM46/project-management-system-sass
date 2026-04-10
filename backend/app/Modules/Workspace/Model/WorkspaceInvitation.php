<?php

namespace App\Modules\Workspace\Model;

use App\Models\User;
use App\Modules\RolesPermissions\Model\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceInvitation extends Model
{
    protected $table = 'workspace_invitations';

    protected $fillable = [
        'workspace_id',
        'email',
        'role_id',
        'invited_by_user_id',
        'accepted_by_user_id',
        'status',
        'token_hash',
        'message',
        'expires_at',
        'sent_at',
        'accepted_at',
        'revoked_at',
    ];

    protected $casts = [
        'role_id' => 'integer',
        'invited_by_user_id' => 'integer',
        'accepted_by_user_id' => 'integer',
        'expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'revoked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function accepter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }
}
