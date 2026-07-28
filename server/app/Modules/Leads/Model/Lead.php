<?php

namespace App\Modules\Leads\Model;

use App\Models\User;
use App\Modules\Comments\Model\Comment;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory;
    use BelongsToWorkspace;
    use SoftDeletes;

    protected $table = 'leads';

    protected $fillable = [
        'workspace_id',
        'course_id',
        'stage_id',
        'title',
        'description',
        'phone',
        'source',
        'lost_reason',
        'created_by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class, 'stage_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(LeadAssignment::class, 'lead_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lead_assignments', 'lead_id', 'user_id')
            ->withPivot(['assigned_by_user_id', 'created_at']);
    }

    public function history(): HasMany
    {
        return $this->hasMany(LeadHistory::class, 'lead_id')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'lead_id');
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'lead_id');
    }

    public function outboundMessages(): HasMany
    {
        return $this->hasMany(OutboundMessage::class, 'lead_id');
    }
}
