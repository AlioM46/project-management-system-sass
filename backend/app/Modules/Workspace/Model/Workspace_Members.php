<?php

namespace App\Modules\Workspace\Model;

use App\Models\User;
use App\Modules\Epic\Model\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workspace_Members extends Model
{
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
}
