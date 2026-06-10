<?php

namespace App\Modules\Courses\Model;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use App\Modules\Workspace\Model\Concerns\BelongsToWorkspace;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory;
    use BelongsToWorkspace;
    use SoftDeletes;

    protected $table = 'courses';

    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'price',
        'duration_hours',
        'created_by_user_id',
        'active_name_key',
    ];

    protected $hidden = [
        'active_name_key',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_hours' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(Stage::class, 'course_id')->orderBy('position')->orderBy('id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'course_id');
    }
}
