<?php

namespace App\Modules\Notifications\Model;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'type',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function Workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
