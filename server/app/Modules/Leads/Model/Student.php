<?php

namespace App\Modules\Leads\Model;

use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;
    use BelongsToWorkspace;

    protected $table = 'students';

    protected $fillable = [
        'workspace_id',
        'lead_id',
        'student_code',
        'academic_status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }
}
