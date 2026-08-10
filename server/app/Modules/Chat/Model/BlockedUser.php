<?php

namespace App\Modules\Chat\Model;

use App\Models\User;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedUser extends Model
{
    use HasFactory, BelongsToWorkspace;

    protected $table = 'blocked_users';

    protected $fillable = [
        'workspace_id',
        'blocker_id',
        'blocked_id',
    ];

    /**
     * The user who initiated the block.
     */
    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    /**
     * The user who was blocked.
     */
    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }
}
